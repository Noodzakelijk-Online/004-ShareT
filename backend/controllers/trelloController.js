/**
 * Trello Controller
 * Handles Trello OAuth and API interactions
 * Uses PouchDB for platform-agnostic data storage
 */

const { TrelloConnection } = require('../db/pouchdb');

const TRELLO_API_BASE = 'https://api.trello.com/1';

// Helper function to fetch JSON
async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Helper function to post JSON
async function postJSON(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Get Trello auth URL
exports.getAuthUrl = async (req, res) => {
  try {
    const appOrigin = req.query.origin || process.env.PUBLIC_URL || process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 5005}`;
    const authUrl = `https://trello.com/1/authorize?expiration=never&name=ShareT&scope=read,write,account&response_type=token&key=${process.env.TRELLO_API_KEY}&return_url=${encodeURIComponent(appOrigin)}&callback_method=postMessage`;
    
    res.json({
      success: true,
      url: authUrl,
      authUrl // Also include as authUrl for compatibility
    });
  } catch (error) {
    console.error('Get auth URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating auth URL'
    });
  }
};

// Handle OAuth callback
exports.handleCallback = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Store token in session temporarily if session exists
    if (req.session) {
      req.session.trelloToken = token;
    }
    
    // Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5005}`;
    res.redirect(`${frontendUrl}/trello-callback?token=${token}`);
  } catch (error) {
    console.error('Handle callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error handling callback'
    });
  }
};

// Connect Trello with token
exports.connect = async (req, res) => {
  try {
    const token = req.body.token || req.body.trelloToken;
    const userId = req.user._id || req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Trello token is required'
      });
    }

    // Verify token by getting member info
    const memberUrl = `${TRELLO_API_BASE}/members/me?key=${process.env.TRELLO_API_KEY}&token=${token}`;
    const member = await fetchJSON(memberUrl);

    // Save or update connection
    const existing = await TrelloConnection.findByUserId(userId);
    if (existing) {
      await TrelloConnection.updateByUserId(userId, {
        trelloToken: token,
        trelloMemberId: member.id
      });
    } else {
      await TrelloConnection.create({
        userId,
        trelloToken: token,
        trelloMemberId: member.id
      });
    }

    res.json({
      success: true,
      message: 'Trello connected successfully',
      member: {
        id: member.id,
        username: member.username,
        fullName: member.fullName
      }
    });
  } catch (error) {
    console.error('Connect Trello error:', error);
    res.status(500).json({
      success: false,
      message: 'Error connecting Trello'
    });
  }
};

// Get all connections for user
exports.getConnections = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    const connections = connection ? [{
      id: connection._id,
      trelloUsername: connection.trelloUsername || connection.trelloMemberId,
      trelloFullName: connection.trelloFullName || connection.trelloMemberId,
      connectedAt: connection.connectedAt
    }] : [];
    res.json({ success: true, connections });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ success: false, message: 'Error fetching connections' });
  }
};

// Disconnect Trello
exports.disconnect = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await TrelloConnection.deleteByUserId(userId);

    res.json({
      success: true,
      message: 'Trello disconnected'
    });
  } catch (error) {
    console.error('Disconnect Trello error:', error);
    res.status(500).json({
      success: false,
      message: 'Error disconnecting Trello'
    });
  }
};

// Get connection status
exports.getStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    
    if (!connection) {
      return res.json({
        success: true,
        connected: false
      });
    }

    // Verify token is still valid
    try {
      const memberUrl = `${TRELLO_API_BASE}/members/me?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}`;
      const member = await fetchJSON(memberUrl);
      
      res.json({
        success: true,
        connected: true,
        member: {
          id: member.id,
          username: member.username,
          fullName: member.fullName
        }
      });
    } catch (err) {
      // Token invalid, remove connection
      await TrelloConnection.deleteByUserId(userId);
      res.json({
        success: true,
        connected: false
      });
    }
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking status'
    });
  }
};

// Get all boards — Fix #1: Include workspace/organization name for disambiguation
exports.getBoards = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    
    if (!connection) {
      return res.status(401).json({
        success: false,
        message: 'Trello not connected'
      });
    }

    const url = `${TRELLO_API_BASE}/members/me/boards?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&fields=name,desc,url,closed,idOrganization&organization=true&organization_fields=displayName,name`;
    const boards = await fetchJSON(url);

    const openBoards = boards.filter(b => !b.closed).map(board => ({
      ...board,
      organizationName: board.organization?.displayName || board.organization?.name || 'Personal',
      displayLabel: board.organization 
        ? `${board.name} (${board.organization.displayName || board.organization.name})`
        : `${board.name} (Personal)`
    }));

    res.json({
      success: true,
      data: openBoards,
      boards: openBoards
    });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching boards'
    });
  }
};

// Get single board
exports.getBoard = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    const { boardId } = req.params;

    if (!connection) {
      return res.status(401).json({
        success: false,
        message: 'Trello not connected'
      });
    }

    const url = `${TRELLO_API_BASE}/boards/${boardId}?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&organization=true&organization_fields=displayName,name`;
    const board = await fetchJSON(url);

    res.json({
      success: true,
      data: board,
      board
    });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching board'
    });
  }
};

// Get board cards
exports.getBoardCards = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    const { boardId } = req.params;

    if (!connection) {
      return res.status(401).json({
        success: false,
        message: 'Trello not connected'
      });
    }

    const url = `${TRELLO_API_BASE}/boards/${boardId}/cards?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&fields=name,desc,url,due,dueComplete,idBoard,idList`;
    const cards = await fetchJSON(url);

    res.json({
      success: true,
      data: cards,
      cards
    });
  } catch (error) {
    console.error('Get board cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cards'
    });
  }
};

// Get board lists
exports.getBoardLists = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    const { boardId } = req.params;

    if (!connection) {
      return res.status(401).json({
        success: false,
        message: 'Trello not connected'
      });
    }

    const url = `${TRELLO_API_BASE}/boards/${boardId}/lists?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}`;
    const lists = await fetchJSON(url);

    res.json({
      success: true,
      data: lists,
      lists
    });
  } catch (error) {
    console.error('Get board lists error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lists'
    });
  }
};

// Get single card — Fix #10: Include members with avatar data
exports.getCard = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    const { cardId } = req.params;

    if (!connection) {
      return res.status(401).json({
        success: false,
        message: 'Trello not connected'
      });
    }

    const url = `${TRELLO_API_BASE}/cards/${cardId}?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&attachments=true&members=true&member_fields=fullName,username,avatarUrl&checklists=all&pluginData=true`;
    const card = await fetchJSON(url);

    res.json({
      success: true,
      data: card,
      card
    });
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching card'
    });
  }
};

// Get card attachments — Fix #15: Return in chronological order (oldest first)
exports.getCardAttachments = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    const { cardId } = req.params;

    if (!connection) {
      return res.status(401).json({
        success: false,
        message: 'Trello not connected'
      });
    }

    const url = `${TRELLO_API_BASE}/cards/${cardId}/attachments?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}`;
    const attachments = await fetchJSON(url);

    // Fix #15: Sort chronologically (oldest first) matching Trello's native order
    attachments.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: attachments,
      attachments
    });
  } catch (error) {
    console.error('Get card attachments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attachments'
    });
  }
};

// Get card comments — Fix #12: Return ISO timestamps, Fix #13: No limit
exports.getCardComments = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    const { cardId } = req.params;

    if (!connection) {
      return res.status(401).json({
        success: false,
        message: 'Trello not connected'
      });
    }

    // Fix #13: Fetch all comments with limit=1000 to get full history
    const url = `${TRELLO_API_BASE}/cards/${cardId}/actions?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&filter=commentCard&limit=1000`;
    const comments = await fetchJSON(url);

    res.json({
      success: true,
      data: comments,
      comments
    });
  } catch (error) {
    console.error('Get card comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
};

// Fix #13: Get full card action history (all types, not just comments)
exports.getCardActions = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    const { cardId } = req.params;

    if (!connection) {
      return res.status(401).json({
        success: false,
        message: 'Trello not connected'
      });
    }

    const url = `${TRELLO_API_BASE}/cards/${cardId}/actions?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&limit=1000`;
    const actions = await fetchJSON(url);

    res.json({
      success: true,
      data: actions,
      actions
    });
  } catch (error) {
    console.error('Get card actions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching actions'
    });
  }
};

// Fix #7: Get all checklists for a card (multiple checklists support)
exports.getCardChecklists = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    const { cardId } = req.params;

    if (!connection) {
      return res.status(401).json({
        success: false,
        message: 'Trello not connected'
      });
    }

    const url = `${TRELLO_API_BASE}/cards/${cardId}/checklists?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&checkItem_fields=name,state,pos`;
    const checklists = await fetchJSON(url);

    res.json({
      success: true,
      data: checklists,
      checklists
    });
  } catch (error) {
    console.error('Get card checklists error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching checklists'
    });
  }
};

// Fix #10: Get card members with avatar info
exports.getCardMembers = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    const { cardId } = req.params;

    if (!connection) {
      return res.status(401).json({
        success: false,
        message: 'Trello not connected'
      });
    }

    const url = `${TRELLO_API_BASE}/cards/${cardId}/members?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&fields=fullName,username,avatarUrl`;
    const members = await fetchJSON(url);

    res.json({
      success: true,
      data: members,
      members
    });
  } catch (error) {
    console.error('Get card members error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching members'
    });
  }
};

// Fix #14: Get card-level links (URL attachments, not file uploads)
exports.getCardLinks = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    const { cardId } = req.params;

    if (!connection) {
      return res.status(401).json({
        success: false,
        message: 'Trello not connected'
      });
    }

    const url = `${TRELLO_API_BASE}/cards/${cardId}/attachments?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}`;
    const attachments = await fetchJSON(url);

    // Filter for URL-type attachments (links, not file uploads)
    const links = attachments.filter(a => !a.isUpload).map(a => ({
      id: a.id,
      name: a.name,
      url: a.url,
      date: a.date
    }));

    res.json({
      success: true,
      data: links,
      links
    });
  } catch (error) {
    console.error('Get card links error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching card links'
    });
  }
};

// Fix #5: Get Power-Up plugin data for a card
exports.getCardPluginData = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    const { cardId } = req.params;

    if (!connection) {
      return res.status(401).json({
        success: false,
        message: 'Trello not connected'
      });
    }

    const url = `${TRELLO_API_BASE}/cards/${cardId}/pluginData?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}`;
    const pluginData = await fetchJSON(url);

    res.json({
      success: true,
      data: pluginData,
      pluginData
    });
  } catch (error) {
    console.error('Get card plugin data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plugin data'
    });
  }
};

// Add comment to card
exports.addComment = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    const { cardId } = req.params;
    const { text } = req.body;

    if (!connection) {
      return res.status(401).json({
        success: false,
        message: 'Trello not connected'
      });
    }

    const url = `${TRELLO_API_BASE}/cards/${cardId}/actions/comments?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&text=${encodeURIComponent(text)}`;
    const response = await fetch(url, { method: 'POST' });
    const comment = await response.json();

    res.json({
      success: true,
      data: comment,
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
};

// Set due date
exports.setDueDate = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const connection = await TrelloConnection.findByUserId(userId);
    const { cardId } = req.params;
    const { due } = req.body;

    if (!connection) {
      return res.status(401).json({
        success: false,
        message: 'Trello not connected'
      });
    }

    const url = `${TRELLO_API_BASE}/cards/${cardId}?key=${process.env.TRELLO_API_KEY}&token=${connection.trelloToken}&due=${due || 'null'}`;
    const response = await fetch(url, { method: 'PUT' });
    const card = await response.json();

    res.json({
      success: true,
      data: card,
      card
    });
  } catch (error) {
    console.error('Set due date error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting due date'
    });
  }
};
