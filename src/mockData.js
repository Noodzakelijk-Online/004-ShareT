export const workspaces = [
  {
    id: 'w1',
    name: 'Workspace 1',
    boards: [
      {
        id: 'b1',
        name: 'Board 1',
        lists: [
          {
            id: 'l1',
            name: 'List 1',
            cards: [
              { id: 'c1', name: 'Card 1' },
              { id: 'c2', name: 'Card 2' },
            ]
          },
          {
            id: 'l2',
            name: 'List 2',
            cards: [
              { id: 'c3', name: 'Card 3' },
              { id: 'c4', name: 'Card 4' },
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'w2',
    name: 'Workspace 2',
    boards: [
      {
        id: 'b2',
        name: 'Board 2',
        lists: [
          {
            id: 'l3',
            name: 'List 3',
            cards: [
              { id: 'c5', name: 'Card 5' },
              { id: 'c6', name: 'Card 6' },
            ]
          }
        ]
      }
    ]
  }
];
