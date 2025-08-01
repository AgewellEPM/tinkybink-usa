export interface Tile {
  id: string;
  emoji: string;
  text: string;
  speech: string;
  color: string;
  subcategory?: string;
}

export interface Board {
  title: string;
  tiles: Tile[];
}

export const defaultBoards: Record<string, Board> = {
  home: {
    title: 'Home',
    tiles: [
      { id: 'h1', emoji: '🏠', text: 'HOME/SAFE', speech: 'I am home and safe', color: '#20B2AA' },
      { id: 'h2', emoji: '🤚', text: 'WANT', speech: 'I want', color: '#9370DB', subcategory: 'want' },
      { id: 'h3', emoji: '❗', text: 'NEED', speech: 'I need', color: '#FF6347', subcategory: 'need' },
      { id: 'h4', emoji: '😊', text: 'FEEL', speech: 'I feel', color: '#00CED1', subcategory: 'feelings' },
      { id: 'h5', emoji: '🎯', text: 'DO', speech: 'I want to', color: '#8B4513', subcategory: 'actions' },
      { id: 'h6', emoji: '👥', text: 'PEOPLE', speech: 'People', color: '#FF8C00', subcategory: 'people' },
      { id: 'h7', emoji: '📍', text: 'PLACES', speech: 'Places', color: '#32CD32', subcategory: 'places' },
      { id: 'h8', emoji: '🍎', text: 'FOOD', speech: 'Food and drink', color: '#FFD700', subcategory: 'food' },
      { id: 'h9', emoji: '⏰', text: 'TIME', speech: 'Time', color: '#4682B4', subcategory: 'time' },
      { id: 'h10', emoji: '📺', text: 'TV', speech: 'I want to watch TV', color: '#9370DB' },
      { id: 'h11', emoji: '🍕', text: 'EAT', speech: 'I want something to eat', color: '#9370DB' },
      { id: 'h12', emoji: '🥤', text: 'DRINK', speech: 'I want something to drink', color: '#9370DB' }
    ]
  },
  want: {
    title: 'I Want...',
    tiles: [
      { id: 'w1', emoji: '🎮', text: 'PLAY', speech: 'I want to play', color: '#9370DB' },
      { id: 'w2', emoji: '📺', text: 'WATCH TV', speech: 'I want to watch TV', color: '#9370DB' },
      { id: 'w3', emoji: '🎵', text: 'MUSIC', speech: 'I want to listen to music', color: '#9370DB' },
      { id: 'w4', emoji: '📱', text: 'PHONE/TABLET', speech: 'I want my phone or tablet', color: '#9370DB' },
      { id: 'w5', emoji: '🛏️', text: 'REST', speech: 'I want to rest', color: '#9370DB' },
      { id: 'w6', emoji: '🚶', text: 'GO OUT', speech: 'I want to go out', color: '#9370DB', subcategory: 'go_out_options' },
      { id: 'w7', emoji: '📚', text: 'READ', speech: 'I want to read', color: '#9370DB', subcategory: 'reading_options' },
      { id: 'w8', emoji: '🎨', text: 'DRAW/COLOR', speech: 'I want to draw or color', color: '#9370DB', subcategory: 'art_options' },
      { id: 'w9', emoji: '🧸', text: 'TOY', speech: 'I want my toy', color: '#9370DB', subcategory: 'toy_options' },
      { id: 'w10', emoji: '🥤', text: 'DRINK', speech: 'I want something to drink', color: '#9370DB' },
      { id: 'w11', emoji: '🍎', text: 'FOOD', speech: 'I want some food', color: '#9370DB' },
      { id: 'w12', emoji: '🏠', text: 'GO HOME', speech: 'I want to go home', color: '#9370DB', subcategory: 'home_activities' }
    ]
  },
  need: {
    title: 'I Need...',
    tiles: [
      { id: 'n1', emoji: '🚽', text: 'BATHROOM', speech: 'I need the bathroom', color: '#FF6347' },
      { id: 'n2', emoji: '💧', text: 'WATER', speech: 'I need water', color: '#FF6347' },
      { id: 'n3', emoji: '🍽️', text: 'EAT', speech: 'I need to eat', color: '#FF6347' },
      { id: 'n4', emoji: '💊', text: 'MEDICINE', speech: 'I need my medicine', color: '#FF6347' },
      { id: 'n5', emoji: '🆘', text: 'HELP', speech: 'I need help', color: '#FF6347' },
      { id: 'n6', emoji: '🛁', text: 'BATH/SHOWER', speech: 'I need a bath or shower', color: '#FF6347' },
      { id: 'n7', emoji: '👕', text: 'CHANGE CLOTHES', speech: 'I need to change clothes', color: '#FF6347' },
      { id: 'n8', emoji: '🧹', text: 'CLEAN UP', speech: 'I need to clean up', color: '#FF6347' },
      { id: 'n9', emoji: '🩹', text: 'FIRST AID', speech: 'I need first aid', color: '#FF6347' }
    ]
  },
  feelings: {
    title: 'I Feel...',
    tiles: [
      { id: 'f1', emoji: '😊', text: 'HAPPY', speech: 'I feel happy', color: '#00CED1' },
      { id: 'f2', emoji: '😢', text: 'SAD', speech: 'I feel sad', color: '#00CED1' },
      { id: 'f3', emoji: '😠', text: 'ANGRY', speech: 'I feel angry', color: '#00CED1' },
      { id: 'f4', emoji: '😟', text: 'WORRIED', speech: 'I feel worried', color: '#00CED1' },
      { id: 'f5', emoji: '😴', text: 'TIRED', speech: 'I feel tired', color: '#00CED1' },
      { id: 'f6', emoji: '🤢', text: 'SICK', speech: 'I feel sick', color: '#00CED1' },
      { id: 'f7', emoji: '😨', text: 'SCARED', speech: 'I feel scared', color: '#00CED1' },
      { id: 'f8', emoji: '😐', text: 'OKAY', speech: 'I feel okay', color: '#00CED1' },
      { id: 'f9', emoji: '🥰', text: 'LOVED', speech: 'I feel loved', color: '#00CED1' },
      { id: 'f10', emoji: '😤', text: 'FRUSTRATED', speech: 'I feel frustrated', color: '#00CED1' },
      { id: 'f11', emoji: '🤗', text: 'PROUD', speech: 'I feel proud', color: '#00CED1' },
      { id: 'f12', emoji: '😌', text: 'CALM', speech: 'I feel calm', color: '#00CED1' }
    ]
  },
  actions: {
    title: 'I Want To...',
    tiles: [
      { id: 'a1', emoji: '🚶', text: 'GO', speech: 'I want to go', color: '#8B4513' },
      { id: 'a2', emoji: '🛑', text: 'STOP', speech: 'Stop', color: '#8B4513' },
      { id: 'a3', emoji: '👀', text: 'LOOK', speech: 'Look', color: '#8B4513' },
      { id: 'a4', emoji: '👂', text: 'LISTEN', speech: 'Listen', color: '#8B4513' },
      { id: 'a5', emoji: '🤝', text: 'HELP', speech: 'Help me', color: '#8B4513' },
      { id: 'a6', emoji: '⏸️', text: 'WAIT', speech: 'Wait', color: '#8B4513' },
      { id: 'a7', emoji: '🔄', text: 'MORE', speech: 'More', color: '#8B4513' },
      { id: 'a8', emoji: '✅', text: 'FINISHED', speech: 'Finished', color: '#8B4513' },
      { id: 'a9', emoji: '🎯', text: 'TRY', speech: 'I want to try', color: '#8B4513' },
      { id: 'a10', emoji: '🏃', text: 'FAST', speech: 'Fast', color: '#8B4513' },
      { id: 'a11', emoji: '🐌', text: 'SLOW', speech: 'Slow', color: '#8B4513' },
      { id: 'a12', emoji: '🔁', text: 'AGAIN', speech: 'Again', color: '#8B4513' }
    ]
  },
  people: {
    title: 'People',
    tiles: [
      { id: 'p1', emoji: '👨', text: 'DAD', speech: 'Dad', color: '#FF8C00' },
      { id: 'p2', emoji: '👩', text: 'MOM', speech: 'Mom', color: '#FF8C00' },
      { id: 'p3', emoji: '👦', text: 'BROTHER', speech: 'Brother', color: '#FF8C00' },
      { id: 'p4', emoji: '👧', text: 'SISTER', speech: 'Sister', color: '#FF8C00' },
      { id: 'p5', emoji: '👨‍⚕️', text: 'DOCTOR', speech: 'Doctor', color: '#FF8C00' },
      { id: 'p6', emoji: '👩‍🏫', text: 'TEACHER', speech: 'Teacher', color: '#FF8C00' },
      { id: 'p7', emoji: '👫', text: 'FRIEND', speech: 'Friend', color: '#FF8C00' },
      { id: 'p8', emoji: '👴', text: 'GRANDPA', speech: 'Grandpa', color: '#FF8C00' },
      { id: 'p9', emoji: '👵', text: 'GRANDMA', speech: 'Grandma', color: '#FF8C00' },
      { id: 'p10', emoji: '👨‍⚕️', text: 'THERAPIST', speech: 'Therapist', color: '#FF8C00' },
      { id: 'p11', emoji: '👮', text: 'HELPER', speech: 'Helper', color: '#FF8C00' },
      { id: 'p12', emoji: '👤', text: 'SOMEONE', speech: 'Someone', color: '#FF8C00' }
    ]
  },
  places: {
    title: 'Places',
    tiles: [
      { id: 'pl1', emoji: '🏠', text: 'HOME', speech: 'Home', color: '#32CD32' },
      { id: 'pl2', emoji: '🏫', text: 'SCHOOL', speech: 'School', color: '#32CD32' },
      { id: 'pl3', emoji: '🏥', text: 'HOSPITAL', speech: 'Hospital', color: '#32CD32' },
      { id: 'pl4', emoji: '🏪', text: 'STORE', speech: 'Store', color: '#32CD32' },
      { id: 'pl5', emoji: '🏞️', text: 'PARK', speech: 'Park', color: '#32CD32' },
      { id: 'pl6', emoji: '🚗', text: 'CAR', speech: 'Car', color: '#32CD32' },
      { id: 'pl7', emoji: '🏖️', text: 'BEACH', speech: 'Beach', color: '#32CD32' },
      { id: 'pl8', emoji: '🏢', text: 'WORK', speech: 'Work', color: '#32CD32' },
      { id: 'pl9', emoji: '🍽️', text: 'RESTAURANT', speech: 'Restaurant', color: '#32CD32' },
      { id: 'pl10', emoji: '🎮', text: 'GAME ROOM', speech: 'Game room', color: '#32CD32' },
      { id: 'pl11', emoji: '🛏️', text: 'BEDROOM', speech: 'Bedroom', color: '#32CD32' },
      { id: 'pl12', emoji: '🚽', text: 'BATHROOM', speech: 'Bathroom', color: '#32CD32' }
    ]
  },
  food: {
    title: 'Food & Drink',
    tiles: [
      { id: 'fd1', emoji: '🍕', text: 'PIZZA', speech: 'Pizza', color: '#FFD700' },
      { id: 'fd2', emoji: '🍔', text: 'BURGER', speech: 'Burger', color: '#FFD700' },
      { id: 'fd3', emoji: '🍎', text: 'APPLE', speech: 'Apple', color: '#FFD700' },
      { id: 'fd4', emoji: '🍌', text: 'BANANA', speech: 'Banana', color: '#FFD700' },
      { id: 'fd5', emoji: '🥛', text: 'MILK', speech: 'Milk', color: '#FFD700' },
      { id: 'fd6', emoji: '💧', text: 'WATER', speech: 'Water', color: '#FFD700' },
      { id: 'fd7', emoji: '🥪', text: 'SANDWICH', speech: 'Sandwich', color: '#FFD700' },
      { id: 'fd8', emoji: '🍪', text: 'COOKIE', speech: 'Cookie', color: '#FFD700' },
      { id: 'fd9', emoji: '🍦', text: 'ICE CREAM', speech: 'Ice cream', color: '#FFD700' },
      { id: 'fd10', emoji: '🥤', text: 'JUICE', speech: 'Juice', color: '#FFD700' },
      { id: 'fd11', emoji: '🍝', text: 'PASTA', speech: 'Pasta', color: '#FFD700' },
      { id: 'fd12', emoji: '🥣', text: 'CEREAL', speech: 'Cereal', color: '#FFD700' }
    ]
  },
  time: {
    title: 'Time',
    tiles: [
      { id: 't1', emoji: '🌅', text: 'MORNING', speech: 'Morning', color: '#4682B4' },
      { id: 't2', emoji: '☀️', text: 'AFTERNOON', speech: 'Afternoon', color: '#4682B4' },
      { id: 't3', emoji: '🌙', text: 'NIGHT', speech: 'Night', color: '#4682B4' },
      { id: 't4', emoji: '📅', text: 'TODAY', speech: 'Today', color: '#4682B4' },
      { id: 't5', emoji: '⏮️', text: 'YESTERDAY', speech: 'Yesterday', color: '#4682B4' },
      { id: 't6', emoji: '⏭️', text: 'TOMORROW', speech: 'Tomorrow', color: '#4682B4' },
      { id: 't7', emoji: '⏰', text: 'NOW', speech: 'Now', color: '#4682B4' },
      { id: 't8', emoji: '⏳', text: 'LATER', speech: 'Later', color: '#4682B4' },
      { id: 't9', emoji: '📆', text: 'WEEKEND', speech: 'Weekend', color: '#4682B4' },
      { id: 't10', emoji: '🎂', text: 'BIRTHDAY', speech: 'Birthday', color: '#4682B4' },
      { id: 't11', emoji: '🎄', text: 'HOLIDAY', speech: 'Holiday', color: '#4682B4' },
      { id: 't12', emoji: '⏱️', text: 'SOON', speech: 'Soon', color: '#4682B4' }
    ]
  }
};