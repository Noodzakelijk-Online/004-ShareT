
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clipboard, Key } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

const codeSnippets = {
  node: `// Using Node.js with Axios
const axios = require('axios');

const API_KEY = 'your_api_key';

async function createShareLink(boardId, options = {}) {
  try {
    const response = await axios.post('https://api.sharet.app/v1/share', {
      resource_id: boardId,
      resource_type: 'board',
      expiry_days: options.expiryDays || 30,
      read_only: options.readOnly !== false,
      allow_comments: options.allowComments === true
    }, {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating share link:', error);
    throw error;
  }
}`,
  python: `# Using Python with requests
import requests

API_KEY = 'your_api_key'

def create_share_link(board_id, **options):
    url = 'https://api.sharet.app/v1/share'
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    payload = {
        'resource_id': board_id,
        'resource_type': 'board',
        'expiry_days': options.get('expiry_days', 30),
        'read_only': options.get('read_only', True),
        'allow_comments': options.get('allow_comments', False)
    }
    
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()`,
  curl: `# Using cURL
curl -X POST https://api.sharet.app/v1/share \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "resource_id": "board_id",
    "resource_type": "board",
    "expiry_days": 30,
    "read_only": true,
    "allow_comments": false
  }'`
};

const endpoints = [
  {
    method: 'POST',
    path: '/v1/share',
    description: 'Create a new share link',
    parameters: [
      { name: 'resource_id', type: 'string', required: true, description: 'ID of the Trello resource to share' },
      { name: 'resource_type', type: 'string', required: true, description: 'Type of resource (board, list, card)' },
      { name: 'expiry_days', type: 'integer', required: false, description: 'Number of days until the link expires' },
      { name: 'read_only', type: 'boolean', required: false, description: 'Whether the shared resource is read-only' },
      { name: 'allow_comments', type: 'boolean', required: false, description: 'Whether comments are allowed' }
    ]
  },
  {
    method: 'GET',
    path: '/v1/share/{share_id}',
    description: 'Get information about a share link',
    parameters: [
      { name: 'share_id', type: 'string', required: true, description: 'ID of the share link' }
    ]
  },
  {
    method: 'DELETE',
    path: '/v1/share/{share_id}',
    description: 'Delete a share link',
    parameters: [
      { name: 'share_id', type: 'string', required: true, description: 'ID of the share link to delete' }
    ]
  },
  {
    method: 'GET',
    path: '/v1/shares',
    description: 'List all your share links',
    parameters: [
      { name: 'page', type: 'integer', required: false, description: 'Page number for pagination' },
      { name: 'limit', type: 'integer', required: false, description: 'Number of results per page' }
    ]
  }
];

const ApiDocumentation = () => {
  const [language, setLanguage] = useState('node');
  const [activeTab, setActiveTab] = useState('overview');
  
  const copyApiKey = () => {
    // In a real app, this would copy the user's actual API key
    navigator.clipboard.writeText('sk_test_12345abcdef');
    toast.success('API key copied to clipboard');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ShareT API Documentation</h2>
        <Button onClick={copyApiKey} variant="outline">
          <Key className="mr-2 h-4 w-4" />
          Copy API Key
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Learn how to use the ShareT API to programmatically create and manage share links.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The ShareT API allows you to create, manage, and delete share links for your Trello content. 
                This API follows RESTful principles and uses standard HTTP methods for all operations.
              </p>
              <h3 className="text-lg font-semibold mt-4">Authentication</h3>
              <p>
                All API requests must include your API key in the Authorization header as a Bearer token.
              </p>
              <pre className="bg-muted p-4 rounded-md text-sm">
                Authorization: Bearer your_api_key
              </pre>
              <h3 className="text-lg font-semibold mt-4">Rate Limits</h3>
              <p>
                The API has a rate limit of 100 requests per minute per API key. If you exceed this limit, 
                you'll receive a 429 Too Many Requests response.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>
                Detailed information about all available API endpoints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-6">
                  {endpoints.map((endpoint, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-md text-sm text-white font-semibold ${
                          endpoint.method === 'GET' ? 'bg-blue-600' : 
                          endpoint.method === 'POST' ? 'bg-green-600' : 
                          endpoint.method === 'PUT' ? 'bg-orange-600' : 
                          endpoint.method === 'DELETE' ? 'bg-red-600' : ''
                        }`}>
                          {endpoint.method}
                        </span>
                        <code className="text-sm">{endpoint.path}</code>
                      </div>
                      <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                      
                      <div className="pt-2">
                        <h4 className="text-sm font-semibold mb-2">Parameters</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Required</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {endpoint.parameters.map((param, paramIndex) => (
                              <TableRow key={paramIndex}>
                                <TableCell className="font-medium">{param.name}</TableCell>
                                <TableCell>{param.type}</TableCell>
                                <TableCell>{param.required ? 'Yes' : 'No'}</TableCell>
                                <TableCell>{param.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
              <CardDescription>
                Example code for creating a share link in various languages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <TabsList>
                    <TabsTrigger 
                      value="node"
                      onClick={() => setLanguage('node')}
                      className={language === 'node' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      Node.js
                    </TabsTrigger>
                    <TabsTrigger 
                      value="python" 
                      onClick={() => setLanguage('python')}
                      className={language === 'python' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      Python
                    </TabsTrigger>
                    <TabsTrigger 
                      value="curl" 
                      onClick={() => setLanguage('curl')}
                      className={language === 'curl' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      cURL
                    </TabsTrigger>
                  </TabsList>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      navigator.clipboard.writeText(codeSnippets[language]);
                      toast.success('Code copied to clipboard');
                    }}
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="w-full overflow-hidden bg-muted p-4 rounded-md">
                  <pre className="text-sm">
                    <code>{codeSnippets[language]}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiDocumentation;
