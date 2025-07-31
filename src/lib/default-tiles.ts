export const defaultTiles = [
  // Basic Needs
  { id: 'tile-1', text: 'I want', emoji: '🤚', speech: 'I want', backgroundColor: '#FF6B6B', position: 0 },
  { id: 'tile-2', text: 'Yes', emoji: '✅', speech: 'Yes', backgroundColor: '#4ECDC4', position: 1 },
  { id: 'tile-3', text: 'No', emoji: '❌', speech: 'No', backgroundColor: '#FF6B6B', position: 2 },
  { id: 'tile-4', text: 'More', emoji: '➕', speech: 'More please', backgroundColor: '#95E1D3', position: 3 },
  { id: 'tile-5', text: 'Stop', emoji: '🛑', speech: 'Stop', backgroundColor: '#F38181', position: 4 },
  { id: 'tile-6', text: 'Help', emoji: '🆘', speech: 'I need help', backgroundColor: '#AA96DA', position: 5 },
  
  // Feelings
  { id: 'tile-7', text: 'Happy', emoji: '😊', speech: 'I feel happy', backgroundColor: '#FECA57', position: 6 },
  { id: 'tile-8', text: 'Sad', emoji: '😢', speech: 'I feel sad', backgroundColor: '#48DBFB', position: 7 },
  { id: 'tile-9', text: 'Tired', emoji: '😴', speech: 'I am tired', backgroundColor: '#C8B6E2', position: 8 },
  
  // Actions
  { id: 'tile-10', text: 'Eat', emoji: '🍽️', speech: 'I want to eat', backgroundColor: '#FD79A8', position: 9 },
  { id: 'tile-11', text: 'Drink', emoji: '🥤', speech: 'I want to drink', backgroundColor: '#74B9FF', position: 10 },
  { id: 'tile-12', text: 'Bathroom', emoji: '🚽', speech: 'I need the bathroom', backgroundColor: '#A29BFE', position: 11 },
  
  // Social
  { id: 'tile-13', text: 'Hello', emoji: '👋', speech: 'Hello', backgroundColor: '#6C5CE7', position: 12 },
  { id: 'tile-14', text: 'Thank you', emoji: '🙏', speech: 'Thank you', backgroundColor: '#00B894', position: 13 },
  { id: 'tile-15', text: 'Please', emoji: '🤝', speech: 'Please', backgroundColor: '#00CEC9', position: 14 },
];

export const defaultBoards = [
  {
    id: 'board-1',
    name: 'Home',
    tiles: defaultTiles,
    category: 'default',
    isDefault: true,
  },
  {
    id: 'board-2',
    name: 'Quick Phrases',
    tiles: [
      { id: 'qp-1', text: "I don't understand", emoji: '❓', speech: "I don't understand", backgroundColor: '#E17055', position: 0 },
      { id: 'qp-2', text: 'Can you repeat?', emoji: '🔁', speech: 'Can you repeat that?', backgroundColor: '#FDCB6E', position: 1 },
      { id: 'qp-3', text: 'Slower please', emoji: '🐌', speech: 'Please speak slower', backgroundColor: '#6C5CE7', position: 2 },
    ],
    category: 'phrases',
  },
  {
    id: 'board-3',
    name: 'Medical',
    tiles: [
      { id: 'med-1', text: 'Pain', emoji: '🤕', speech: 'I have pain', backgroundColor: '#D63031', position: 0 },
      { id: 'med-2', text: 'Medicine', emoji: '💊', speech: 'I need medicine', backgroundColor: '#74B9FF', position: 1 },
      { id: 'med-3', text: 'Doctor', emoji: '👨‍⚕️', speech: 'I need a doctor', backgroundColor: '#00B894', position: 2 },
    ],
    category: 'medical',
  },
];