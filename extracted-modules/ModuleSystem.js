class ModuleSystem {
      constructor() {
        this.modules = new Map();
        this.initialized = false;
      }
      
      register(name, module) {
        this.modules.set(name, module);
      }
      
      get(name) {
        return this.modules.get(name);
      }
      
      async initialize() {
        console.log(`Initializing ${this.modules.size} modules...`);
        for (const [name, module] of this.modules) {
          if (module.initialize) {
            try {
              await module.initialize();
              console.log(`✓ ${name} initialized`);
            } catch (error) {
              console.error(`✗ ${name} failed:`, error);
            }
          }
        }
        this.initialized = true;
      }
    }
    
    const moduleSystem = new ModuleSystem();
    
    // ========================================
    // CORE VARIABLES
    // ========================================
    let boards = {};
    let currentBoard = 'home';
    let boardHistory = [];
    let editMode = false;
    let actionMode = false;
    let settings = {
      speechRate: 1,
      speechPitch: 1,
      speechVolume: 1,
      gridColumns: 3,
      tileScale: 1,
      emojiScale: 1,
      fontScale: 1,
      selectedVoice: null
    };
    let voices = [];
    let sentence = [];
    let chirps = [];
    
    // ========================================
    // DEFAULT BOARDS DATA
    // ========================================
    function getDefaultBoards() {
      return {
        home: {
          title: 'Home',
          tiles: [
            { id: 'h1', emoji: '🏠', text: 'HOME/SAFE', speech: 'I am home and safe', color: 'tile-home' },
            { id: 'h2', emoji: '🤚', text: 'WANT', speech: 'I want', color: 'tile-want', subcategory: 'wants' },
            { id: 'h3', emoji: '❗', text: 'NEED', speech: 'I need', color: 'tile-need', subcategory: 'needs' },
            { id: 'h4', emoji: '😊', text: 'FEEL', speech: 'I feel', color: 'tile-feel', subcategory: 'feelings' },
            { id: 'h5', emoji: '🎯', text: 'DO', speech: 'I want to', color: 'tile-action', subcategory: 'actions' },
            { id: 'h6', emoji: '👥', text: 'PEOPLE', speech: 'People', color: 'tile-people', subcategory: 'people' },
            { id: 'h7', emoji: '📍', text: 'PLACES', speech: 'Places', color: 'tile-place', subcategory: 'places' },
            { id: 'h8', emoji: '🍎', text: 'FOOD', speech: 'Food and drink', color: 'tile-food', subcategory: 'food' },
            { id: 'h9', emoji: '⏰', text: 'TIME', speech: 'Time', color: 'tile-time', subcategory: 'time' },
            { id: 'h10', emoji: '📺', text: 'TV', speech: 'I want to watch TV', color: 'tile-want' },
            { id: 'h11', emoji: '🍕', text: 'EAT', speech: 'I want something to eat', color: 'tile-want' },
            { id: 'h12', emoji: '🥤', text: 'DRINK', speech: 'I want something to drink', color: 'tile-want' }
          ]
        },
        wants: {
          title: 'I Want...',
          tiles: [
            { id: 'w1', emoji: '🎮', text: 'PLAY', speech: 'I want to play', color: 'tile-want' },
            { id: 'w2', emoji: '📺', text: 'WATCH TV', speech: 'I want to watch TV', color: 'tile-want' },
            { id: 'w3', emoji: '🎵', text: 'MUSIC', speech: 'I want to listen to music', color: 'tile-want' },
            { id: 'w4', emoji: '📱', text: 'PHONE/TABLET', speech: 'I want my phone or tablet', color: 'tile-want' },
            { id: 'w5', emoji: '🛏️', text: 'REST', speech: 'I want to rest', color: 'tile-want' },
            { id: 'w6', emoji: '🚶', text: 'GO OUT', speech: 'I want to go out', color: 'tile-want', subcategory: 'go_out_options' },
            { id: 'w7', emoji: '📚', text: 'READ', speech: 'I want to read', color: 'tile-want', subcategory: 'reading_options' },
            { id: 'w8', emoji: '🎨', text: 'DRAW/COLOR', speech: 'I want to draw or color', color: 'tile-want', subcategory: 'art_options' },
            { id: 'w9', emoji: '🧸', text: 'TOY', speech: 'I want my toy', color: 'tile-want', subcategory: 'toy_options' },
            { id: 'w10', emoji: '🥤', text: 'DRINK', speech: 'I want something to drink', color: 'tile-want' },
            { id: 'w11', emoji: '🍎', text: 'FOOD', speech: 'I want some food', color: 'tile-want' },
            { id: 'w12', emoji: '🏠', text: 'GO HOME', speech: 'I want to go home', color: 'tile-want', subcategory: 'home_activities' }
          ]
        },
        needs: {
          title: 'I Need...',
          tiles: [
            { id: 'n1', emoji: '🚽', text: 'BATHROOM', speech: 'I need the bathroom', color: 'tile-need' },
            { id: 'n2', emoji: '💧', text: 'WATER', speech: 'I need water', color: 'tile-need' },
            { id: 'n3', emoji: '🍽️', text: 'EAT', speech: 'I need to eat', color: 'tile-need' },
            { id: 'n4', emoji: '💊', text: 'MEDICINE', speech: 'I need my medicine', color: 'tile-need' },
            { id: 'n5', emoji: '🆘', text: 'HELP', speech: 'I need help', color: 'tile-need' },
            { id: 'n6', emoji: '🛁', text: 'BATH/SHOWER', speech: 'I need a bath or shower', color: 'tile-need' },
            { id: 'n7', emoji: '👕', text: 'CHANGE CLOTHES', speech: 'I need to change clothes', color: 'tile-need' },
            { id: 'n8', emoji: '🧹', text: 'CLEAN UP', speech: 'I need to clean up', color: 'tile-need' },
            { id: 'n9', emoji: '🩹', text: 'FIRST AID', speech: 'I need first aid', color: 'tile-need' }
          ]
        },
        feelings: {
          title: 'I Feel...',
          tiles: [
            { id: 'f1', emoji: '😊', text: 'HAPPY', speech: 'I feel happy', color: 'tile-feel' },
            { id: 'f2', emoji: '😢', text: 'SAD', speech: 'I feel sad', color: 'tile-feel' },
            { id: 'f3', emoji: '😡', text: 'ANGRY', speech: 'I feel angry', color: 'tile-feel' },
            { id: 'f4', emoji: '😨', text: 'SCARED', speech: 'I feel scared', color: 'tile-feel' },
            { id: 'f5', emoji: '😴', text: 'TIRED', speech: 'I feel tired', color: 'tile-feel' },
            { id: 'f6', emoji: '🤒', text: 'SICK', speech: 'I feel sick', color: 'tile-feel' },
            { id: 'f7', emoji: '😕', text: 'CONFUSED', speech: 'I feel confused', color: 'tile-feel' },
            { id: 'f8', emoji: '😌', text: 'CALM', speech: 'I feel calm', color: 'tile-feel' },
            { id: 'f9', emoji: '🤗', text: 'LOVED', speech: 'I feel loved', color: 'tile-feel' }
          ]
        },
        actions: {
          title: 'I Want To...',
          tiles: [
            { id: 'a1', emoji: '🏃', text: 'GO', speech: 'go', color: 'tile-action' },
            { id: 'a2', emoji: '🛑', text: 'STOP', speech: 'stop', color: 'tile-action' },
            { id: 'a3', emoji: '👀', text: 'LOOK', speech: 'look', color: 'tile-action' },
            { id: 'a4', emoji: '👂', text: 'LISTEN', speech: 'listen', color: 'tile-action' },
            { id: 'a5', emoji: '🤝', text: 'SHARE', speech: 'share', color: 'tile-action' },
            { id: 'a6', emoji: '🎯', text: 'TRY', speech: 'try', color: 'tile-action' },
            { id: 'a7', emoji: '⏰', text: 'WAIT', speech: 'wait', color: 'tile-action' },
            { id: 'a8', emoji: '🙏', text: 'PLEASE', speech: 'please', color: 'tile-action' },
            { id: 'a9', emoji: '🙏', text: 'THANK YOU', speech: 'thank you', color: 'tile-action' }
          ]
        },
        people: {
          title: 'People',
          tiles: [
            { id: 'p1', emoji: '👩', text: 'MOM', speech: 'mom', color: 'tile-family' },
            { id: 'p2', emoji: '👨', text: 'DAD', speech: 'dad', color: 'tile-family' },
            { id: 'p3', emoji: '👧', text: 'SISTER', speech: 'sister', color: 'tile-family' },
            { id: 'p4', emoji: '👦', text: 'BROTHER', speech: 'brother', color: 'tile-family' },
            { id: 'p5', emoji: '👵', text: 'GRANDMA', speech: 'grandma', color: 'tile-family' },
            { id: 'p6', emoji: '👴', text: 'GRANDPA', speech: 'grandpa', color: 'tile-family' },
            { id: 'p7', emoji: '👩‍🏫', text: 'TEACHER', speech: 'teacher', color: 'tile-authority' },
            { id: 'p8', emoji: '👫', text: 'FRIEND', speech: 'friend', color: 'tile-friends' },
            { id: 'p9', emoji: '👨‍⚕️', text: 'DOCTOR', speech: 'doctor', color: 'tile-authority' }
          ]
        },
        places: {
          title: 'Places',
          tiles: [
            { id: 'pl1', emoji: '🏠', text: 'HOME', speech: 'home', color: 'tile-place' },
            { id: 'pl2', emoji: '🏫', text: 'SCHOOL', speech: 'school', color: 'tile-place' },
            { id: 'pl3', emoji: '🏪', text: 'STORE', speech: 'store', color: 'tile-place' },
            { id: 'pl4', emoji: '🏥', text: 'HOSPITAL', speech: 'hospital', color: 'tile-place' },
            { id: 'pl5', emoji: '🏞️', text: 'PARK', speech: 'park', color: 'tile-place' },
            { id: 'pl6', emoji: '🛏️', text: 'BEDROOM', speech: 'bedroom', color: 'tile-place' },
            { id: 'pl7', emoji: '🍳', text: 'KITCHEN', speech: 'kitchen', color: 'tile-place' },
            { id: 'pl8', emoji: '🚗', text: 'CAR', speech: 'car', color: 'tile-place' },
            { id: 'pl9', emoji: '🏖️', text: 'OUTSIDE', speech: 'outside', color: 'tile-place' }
          ]
        },
        food: {
          title: 'Food & Drink',
          tiles: [
            { id: 'fd1', emoji: '💧', text: 'WATER', speech: 'water', color: 'tile-food-drinks' },
            { id: 'fd2', emoji: '🥛', text: 'MILK', speech: 'milk', color: 'tile-food-drinks' },
            { id: 'fd3', emoji: '🧃', text: 'JUICE', speech: 'juice', color: 'tile-food-drinks' },
            { id: 'fd4', emoji: '🍎', text: 'APPLE', speech: 'apple', color: 'tile-food-healthy' },
            { id: 'fd5', emoji: '🍌', text: 'BANANA', speech: 'banana', color: 'tile-food-healthy' },
            { id: 'fd6', emoji: '🍕', text: 'PIZZA', speech: 'pizza', color: 'tile-food-meals' },
            { id: 'fd7', emoji: '🥪', text: 'SANDWICH', speech: 'sandwich', color: 'tile-food-meals' },
            { id: 'fd8', emoji: '🍪', text: 'COOKIE', speech: 'cookie', color: 'tile-food-treats' },
            { id: 'fd9', emoji: '🍦', text: 'ICE CREAM', speech: 'ice cream', color: 'tile-food-treats' }
          ]
        },
        time: {
          title: 'Time',
          tiles: [
            { id: 't1', emoji: '🌅', text: 'MORNING', speech: 'morning', color: 'tile-time' },
            { id: 't2', emoji: '☀️', text: 'AFTERNOON', speech: 'afternoon', color: 'tile-time' },
            { id: 't3', emoji: '🌙', text: 'NIGHT', speech: 'night', color: 'tile-time' },
            { id: 't4', emoji: '📅', text: 'TODAY', speech: 'today', color: 'tile-time' },
            { id: 't5', emoji: '📆', text: 'TOMORROW', speech: 'tomorrow', color: 'tile-time' },
            { id: 't6', emoji: '⏰', text: 'NOW', speech: 'now', color: 'tile-time' },
            { id: 't7', emoji: '⏳', text: 'LATER', speech: 'later', color: 'tile-time' },
            { id: 't8', emoji: '🍽️', text: 'MEAL TIME', speech: 'meal time', color: 'tile-time' },
            { id: 't9', emoji: '😴', text: 'BED TIME', speech: 'bed time', color: 'tile-time' }
          ]
        },
        // ========================================
        // LOCATION-SPECIFIC BOARDS
        // ========================================
        family_routine: {
          title: 'Family Routine',
          tiles: [
            { id: 'fr1', emoji: '🌅', text: 'WAKE UP', speech: 'Wake up time', color: 'tile-home' },
            { id: 'fr2', emoji: '🥞', text: 'BREAKFAST', speech: 'Breakfast time', color: 'tile-food' },
            { id: 'fr3', emoji: '👕', text: 'GET DRESSED', speech: 'Get dressed', color: 'tile-action' },
            { id: 'fr4', emoji: '🪥', text: 'BRUSH TEETH', speech: 'Brush teeth', color: 'tile-need' },
            { id: 'fr5', emoji: '🎒', text: 'PACK BAG', speech: 'Pack my bag', color: 'tile-action' },
            { id: 'fr6', emoji: '🚌', text: 'SCHOOL BUS', speech: 'Time for school bus', color: 'tile-place' },
            { id: 'fr7', emoji: '🏠', text: 'COME HOME', speech: 'Come home', color: 'tile-home' },
            { id: 'fr8', emoji: '📚', text: 'HOMEWORK', speech: 'Do homework', color: 'tile-action' },
            { id: 'fr9', emoji: '🛏️', text: 'BEDTIME', speech: 'Bedtime', color: 'tile-home' }
          ]
        },
        classroom_schedule: {
          title: 'School Day',
          tiles: [
            { id: 'cs1', emoji: '👋', text: 'GOOD MORNING', speech: 'Good morning teacher', color: 'tile-authority' },
            { id: 'cs2', emoji: '⭕', text: 'CIRCLE TIME', speech: 'Circle time', color: 'tile-action' },
            { id: 'cs3', emoji: '📖', text: 'READING', speech: 'Reading time', color: 'tile-action' },
            { id: 'cs4', emoji: '🔢', text: 'MATH', speech: 'Math time', color: 'tile-action' },
            { id: 'cs5', emoji: '🍎', text: 'SNACK TIME', speech: 'Snack time', color: 'tile-food' },
            { id: 'cs6', emoji: '🎮', text: 'RECESS', speech: 'Recess time', color: 'tile-want' },
            { id: 'cs7', emoji: '🎨', text: 'ART CLASS', speech: 'Art class', color: 'tile-want' },
            { id: 'cs8', emoji: '🚽', text: 'BATHROOM', speech: 'May I use the bathroom?', color: 'tile-need' },
            { id: 'cs9', emoji: '🆘', text: 'HELP PLEASE', speech: 'I need help please', color: 'tile-need' }
          ]
        },
        social_communication: {
          title: 'Social Skills',
          tiles: [
            { id: 'sc1', emoji: '👋', text: 'HELLO', speech: 'Hello', color: 'tile-people' },
            { id: 'sc2', emoji: '🙋', text: 'MY TURN', speech: 'My turn', color: 'tile-action' },
            { id: 'sc3', emoji: '👉', text: 'YOUR TURN', speech: 'Your turn', color: 'tile-people' },
            { id: 'sc4', emoji: '🤝', text: 'SHARE', speech: 'Let me share', color: 'tile-action' },
            { id: 'sc5', emoji: '🎮', text: 'CAN I PLAY?', speech: 'Can I play with you?', color: 'tile-want' },
            { id: 'sc6', emoji: '🙏', text: 'PLEASE', speech: 'Please', color: 'tile-action' },
            { id: 'sc7', emoji: '🤗', text: 'THANK YOU', speech: 'Thank you', color: 'tile-action' },
            { id: 'sc8', emoji: '😊', text: 'YOU\'RE WELCOME', speech: 'You are welcome', color: 'tile-action' },
            { id: 'sc9', emoji: '👋', text: 'GOODBYE', speech: 'Goodbye', color: 'tile-people' }
          ]
        },
        bathroom_request: {
          title: 'Bathroom Needs',
          tiles: [
            { id: 'br1', emoji: '🚽', text: 'BATHROOM', speech: 'I need the bathroom', color: 'tile-need' },
            { id: 'br2', emoji: '⚡', text: 'URGENT', speech: 'I really need to go', color: 'tile-need' },
            { id: 'br3', emoji: '🧻', text: 'TOILET PAPER', speech: 'I need toilet paper', color: 'tile-need' },
            { id: 'br4', emoji: '🧼', text: 'WASH HANDS', speech: 'Wash hands', color: 'tile-action' },
            { id: 'br5', emoji: '💧', text: 'WATER', speech: 'I need water', color: 'tile-need' },
            { id: 'br6', emoji: '🚪', text: 'PRIVACY', speech: 'I need privacy', color: 'tile-need' },
            { id: 'br7', emoji: '✅', text: 'ALL DONE', speech: 'All done', color: 'tile-action' },
            { id: 'br8', emoji: '🆘', text: 'HELP', speech: 'I need help', color: 'tile-need' },
            { id: 'br9', emoji: '🤒', text: 'NOT FEELING WELL', speech: 'I do not feel well', color: 'tile-feel' }
          ]
        },
        therapy_session: {
          title: 'Therapy Time',
          tiles: [
            { id: 'ts1', emoji: '👋', text: 'HELLO', speech: 'Hello therapist', color: 'tile-people' },
            { id: 'ts2', emoji: '✏️', text: 'WORK TIME', speech: 'Work time', color: 'tile-action' },
            { id: 'ts3', emoji: '✅', text: 'FINISHED', speech: 'I am finished', color: 'tile-action' },
            { id: 'ts4', emoji: '⏸️', text: 'BREAK', speech: 'I need a break', color: 'tile-need' },
            { id: 'ts5', emoji: '🎯', text: 'TRY AGAIN', speech: 'I will try again', color: 'tile-action' },
            { id: 'ts6', emoji: '🆘', text: 'HELP', speech: 'I need help', color: 'tile-need' },
            { id: 'ts7', emoji: '😊', text: 'GOOD JOB', speech: 'Good job', color: 'tile-feel' },
            { id: 'ts8', emoji: '🎁', text: 'REWARD', speech: 'Time for reward', color: 'tile-want' },
            { id: 'ts9', emoji: '👋', text: 'GOODBYE', speech: 'Goodbye, see you next time', color: 'tile-people' }
          ]
        },
        behavior_support: {
          title: 'Calm Down',
          tiles: [
            { id: 'bs1', emoji: '🌬️', text: 'DEEP BREATHS', speech: 'Take deep breaths', color: 'tile-action' },
            { id: 'bs2', emoji: '🔢', text: 'COUNT TO 10', speech: 'Count to ten', color: 'tile-action' },
            { id: 'bs3', emoji: '🤲', text: 'SQUEEZE HANDS', speech: 'Squeeze my hands', color: 'tile-action' },
            { id: 'bs4', emoji: '⏸️', text: 'I NEED SPACE', speech: 'I need some space', color: 'tile-need' },
            { id: 'bs5', emoji: '💧', text: 'DRINK WATER', speech: 'I need water', color: 'tile-need' },
            { id: 'bs6', emoji: '🚶', text: 'WALK AROUND', speech: 'I need to walk around', color: 'tile-action' },
            { id: 'bs7', emoji: '🆘', text: 'HELP ME', speech: 'I need help to calm down', color: 'tile-need' },
            { id: 'bs8', emoji: '😌', text: 'FEELING BETTER', speech: 'I am feeling better', color: 'tile-feel' },
            { id: 'bs9', emoji: '✅', text: 'ALL BETTER', speech: 'I am all better now', color: 'tile-feel' }
          ]
        },
        communication_goals: {
          title: 'Communication Practice',
          tiles: [
            { id: 'cg1', emoji: '🗣️', text: 'I WANT TO SAY', speech: 'I want to say', color: 'tile-action' },
            { id: 'cg2', emoji: '👀', text: 'I SEE', speech: 'I see', color: 'tile-action' },
            { id: 'cg3', emoji: '✋', text: 'I HAVE', speech: 'I have', color: 'tile-action' },
            { id: 'cg4', emoji: '➕', text: 'MORE', speech: 'More please', color: 'tile-want' },
            { id: 'cg5', emoji: '🛑', text: 'STOP', speech: 'Stop', color: 'tile-action' },
            { id: 'cg6', emoji: '🔄', text: 'AGAIN', speech: 'Again', color: 'tile-want' },
            { id: 'cg7', emoji: '✅', text: 'YES', speech: 'Yes', color: 'tile-action' },
            { id: 'cg8', emoji: '❌', text: 'NO', speech: 'No', color: 'tile-action' },
            { id: 'cg9', emoji: '❓', text: 'WHAT IS THAT?', speech: 'What is that?', color: 'tile-action' }
          ]
        },
        restaurant: {
          title: 'At Restaurant',
          tiles: [
            { id: 'r1', emoji: '📋', text: 'MENU PLEASE', speech: 'May I see the menu please', color: 'tile-need' },
            { id: 'r2', emoji: '🤚', text: 'I WANT', speech: 'I want', color: 'tile-want' },
            { id: 'r3', emoji: '💧', text: 'WATER', speech: 'Water please', color: 'tile-food' },
            { id: 'r4', emoji: '🥤', text: 'DRINK', speech: 'I want a drink', color: 'tile-food' },
            { id: 'r5', emoji: '🍽️', text: 'FOOD', speech: 'I want food', color: 'tile-food' },
            { id: 'r6', emoji: '🚽', text: 'BATHROOM', speech: 'Where is the bathroom?', color: 'tile-need' },
            { id: 'r7', emoji: '✅', text: 'ALL DONE', speech: 'I am all done eating', color: 'tile-action' },
            { id: 'r8', emoji: '🙏', text: 'THANK YOU', speech: 'Thank you', color: 'tile-action' },
            { id: 'r9', emoji: '💳', text: 'CHECK PLEASE', speech: 'Check please', color: 'tile-need' }
          ]
        },
        food_choices: {
          title: 'Food Options',
          tiles: [
            { id: 'fc1', emoji: '🍕', text: 'PIZZA', speech: 'Pizza', color: 'tile-food' },
            { id: 'fc2', emoji: '🍔', text: 'BURGER', speech: 'Hamburger', color: 'tile-food' },
            { id: 'fc3', emoji: '🌮', text: 'TACO', speech: 'Taco', color: 'tile-food' },
            { id: 'fc4', emoji: '🍝', text: 'PASTA', speech: 'Pasta', color: 'tile-food' },
            { id: 'fc5', emoji: '🥗', text: 'SALAD', speech: 'Salad', color: 'tile-food' },
            { id: 'fc6', emoji: '🍎', text: 'FRUIT', speech: 'Fruit', color: 'tile-food' },
            { id: 'fc7', emoji: '🍪', text: 'DESSERT', speech: 'Dessert', color: 'tile-food' },
            { id: 'fc8', emoji: '🥛', text: 'MILK', speech: 'Milk', color: 'tile-food' },
            { id: 'fc9', emoji: '🧃', text: 'JUICE', speech: 'Juice', color: 'tile-food' }
          ]
        },
        manners: {
          title: 'Good Manners',
          tiles: [
            { id: 'm1', emoji: '🙏', text: 'PLEASE', speech: 'Please', color: 'tile-action' },
            { id: 'm2', emoji: '🤗', text: 'THANK YOU', speech: 'Thank you', color: 'tile-action' },
            { id: 'm3', emoji: '🙏', text: 'EXCUSE ME', speech: 'Excuse me', color: 'tile-action' },
            { id: 'm4', emoji: '😊', text: 'YOU\'RE WELCOME', speech: 'You are welcome', color: 'tile-action' },
            { id: 'm5', emoji: '😔', text: 'SORRY', speech: 'I am sorry', color: 'tile-feel' },
            { id: 'm6', emoji: '🤝', text: 'NICE TO MEET YOU', speech: 'Nice to meet you', color: 'tile-people' },
            { id: 'm7', emoji: '🍽️', text: 'MAY I HAVE', speech: 'May I have', color: 'tile-want' },
            { id: 'm8', emoji: '🤫', text: 'QUIET VOICE', speech: 'I will use my quiet voice', color: 'tile-action' },
            { id: 'm9', emoji: '⏰', text: 'WAIT MY TURN', speech: 'I will wait my turn', color: 'tile-action' }
          ]
        },
        doctor_visit: {
          title: 'Doctor Visit',
          tiles: [
            { id: 'dv1', emoji: '👨‍⚕️', text: 'DOCTOR', speech: 'Hello doctor', color: 'tile-authority' },
            { id: 'dv2', emoji: '😊', text: 'I FEEL GOOD', speech: 'I feel good', color: 'tile-feel' },
            { id: 'dv3', emoji: '🤒', text: 'I FEEL SICK', speech: 'I feel sick', color: 'tile-feel' },
            { id: 'dv4', emoji: '😣', text: 'IT HURTS', speech: 'It hurts', color: 'tile-feel' },
            { id: 'dv5', emoji: '💪', text: 'I AM BRAVE', speech: 'I am brave', color: 'tile-feel' },
            { id: 'dv6', emoji: '👂', text: 'CHECK MY EARS', speech: 'Check my ears', color: 'tile-action' },
            { id: 'dv7', emoji: '💓', text: 'CHECK MY HEART', speech: 'Listen to my heart', color: 'tile-action' },
            { id: 'dv8', emoji: '💊', text: 'MEDICINE', speech: 'I need medicine', color: 'tile-need' },
            { id: 'dv9', emoji: '✅', text: 'ALL DONE', speech: 'All done', color: 'tile-action' }
          ]
        },
        calm_down: {
          title: 'Stay Calm',
          tiles: [
            { id: 'cd1', emoji: '😌', text: 'STAY CALM', speech: 'I will stay calm', color: 'tile-feel' },
            { id: 'cd2', emoji: '🌬️', text: 'BREATHE', speech: 'Breathe slowly', color: 'tile-action' },
            { id: 'cd3', emoji: '👐', text: 'RELAX', speech: 'Relax', color: 'tile-action' },
            { id: 'cd4', emoji: '🤗', text: 'HUG', speech: 'I need a hug', color: 'tile-need' },
            { id: 'cd5', emoji: '💪', text: 'I AM STRONG', speech: 'I am strong', color: 'tile-feel' },
            { id: 'cd6', emoji: '⏰', text: 'WAIT', speech: 'I can wait', color: 'tile-action' },
            { id: 'cd7', emoji: '😊', text: 'IT\'S OK', speech: 'It is okay', color: 'tile-feel' },
            { id: 'cd8', emoji: '🆘', text: 'HELP ME', speech: 'Help me stay calm', color: 'tile-need' },
            { id: 'cd9', emoji: '✨', text: 'FEELING BETTER', speech: 'I am feeling better', color: 'tile-feel' }
          ]
        },
        medical_needs: {
          title: 'Medical Needs',
          tiles: [
            { id: 'mn1', emoji: '💊', text: 'MEDICINE TIME', speech: 'Time for medicine', color: 'tile-need' },
            { id: 'mn2', emoji: '🩹', text: 'BANDAID', speech: 'I need a bandaid', color: 'tile-need' },
            { id: 'mn3', emoji: '🤒', text: 'FEVER', speech: 'I have a fever', color: 'tile-feel' },
            { id: 'mn4', emoji: '😷', text: 'MASK', speech: 'I need my mask', color: 'tile-need' },
            { id: 'mn5', emoji: '💉', text: 'SHOT', speech: 'I need a shot', color: 'tile-need' },
            { id: 'mn6', emoji: '🏥', text: 'HOSPITAL', speech: 'Go to hospital', color: 'tile-place' },
            { id: 'mn7', emoji: '🚑', text: 'EMERGENCY', speech: 'This is an emergency', color: 'tile-need' },
            { id: 'mn8', emoji: '📞', text: 'CALL DOCTOR', speech: 'Call the doctor', color: 'tile-need' },
            { id: 'mn9', emoji: '🛌', text: 'REST', speech: 'I need to rest', color: 'tile-need' }
          ]
        },
        playground: {
          title: 'Playground Fun',
          tiles: [
            { id: 'pg1', emoji: '🎠', text: 'SWING', speech: 'I want to swing', color: 'tile-want' },
            { id: 'pg2', emoji: '🛝', text: 'SLIDE', speech: 'I want to slide', color: 'tile-want' },
            { id: 'pg3', emoji: '🧗', text: 'CLIMB', speech: 'I want to climb', color: 'tile-want' },
            { id: 'pg4', emoji: '🏃', text: 'RUN', speech: 'I want to run', color: 'tile-want' },
            { id: 'pg5', emoji: '🦘', text: 'JUMP', speech: 'I want to jump', color: 'tile-want' },
            { id: 'pg6', emoji: '⚽', text: 'BALL', speech: 'Play with ball', color: 'tile-want' },
            { id: 'pg7', emoji: '🤝', text: 'PLAY TOGETHER', speech: 'Let us play together', color: 'tile-people' },
            { id: 'pg8', emoji: '🪑', text: 'REST', speech: 'I need to rest', color: 'tile-need' },
            { id: 'pg9', emoji: '💧', text: 'WATER BREAK', speech: 'I need water', color: 'tile-need' }
          ]
        },
        outdoor_activities: {
          title: 'Outdoor Fun',
          tiles: [
            { id: 'oa1', emoji: '🚴', text: 'BIKE RIDE', speech: 'Bike ride', color: 'tile-want' },
            { id: 'oa2', emoji: '🚶', text: 'WALK', speech: 'Go for a walk', color: 'tile-want' },
            { id: 'oa3', emoji: '🏊', text: 'SWIMMING', speech: 'Go swimming', color: 'tile-want' },
            { id: 'oa4', emoji: '🌳', text: 'NATURE', speech: 'Look at nature', color: 'tile-action' },
            { id: 'oa5', emoji: '🐦', text: 'BIRDS', speech: 'Look at birds', color: 'tile-action' },
            { id: 'oa6', emoji: '🌸', text: 'FLOWERS', speech: 'Look at flowers', color: 'tile-action' },
            { id: 'oa7', emoji: '🏖️', text: 'SANDBOX', speech: 'Play in sandbox', color: 'tile-want' },
            { id: 'oa8', emoji: '🍃', text: 'FRESH AIR', speech: 'Fresh air', color: 'tile-feel' },
            { id: 'oa9', emoji: '☀️', text: 'SUNSHINE', speech: 'Sunshine', color: 'tile-feel' }
          ]
        },
        social_play: {
          title: 'Playing with Friends',
          tiles: [
            { id: 'sp1', emoji: '👫', text: 'FRIENDS', speech: 'My friends', color: 'tile-people' },
            { id: 'sp2', emoji: '🎮', text: 'PLAY GAME', speech: 'Let us play a game', color: 'tile-want' },
            { id: 'sp3', emoji: '🤝', text: 'TAKE TURNS', speech: 'We take turns', color: 'tile-action' },
            { id: 'sp4', emoji: '🎯', text: 'FOLLOW RULES', speech: 'Follow the rules', color: 'tile-action' },
            { id: 'sp5', emoji: '😊', text: 'HAVE FUN', speech: 'Have fun', color: 'tile-feel' },
            { id: 'sp6', emoji: '🏆', text: 'GOOD GAME', speech: 'Good game', color: 'tile-action' },
            { id: 'sp7', emoji: '🤗', text: 'BE KIND', speech: 'Be kind', color: 'tile-action' },
            { id: 'sp8', emoji: '💬', text: 'TALK', speech: 'Let us talk', color: 'tile-action' },
            { id: 'sp9', emoji: '👋', text: 'SEE YOU LATER', speech: 'See you later', color: 'tile-people' }
          ]
        },
        
        // ========================================
        // 3RD TIER DRILL-DOWN BOARDS
        // ========================================
        
        // DRINK OPTIONS - "I want juice" → "What kind of juice?"
        drink_options: {
          title: 'What kind of drink?',
          tiles: [
            { id: 'dr1', emoji: '🧃', text: 'JUICE', speech: 'I want juice', color: 'tile-food-drinks', subcategory: 'juice_options' },
            { id: 'dr2', emoji: '💧', text: 'WATER', speech: 'I want water', color: 'tile-food-drinks' },
            { id: 'dr3', emoji: '🥛', text: 'MILK', speech: 'I want milk', color: 'tile-food-drinks' },
            { id: 'dr4', emoji: '🥤', text: 'SODA', speech: 'I want soda', color: 'tile-want', subcategory: 'soda_options' },
            { id: 'dr5', emoji: '☕', text: 'COFFEE', speech: 'I want coffee', color: 'tile-want' },
            { id: 'dr6', emoji: '🍵', text: 'TEA', speech: 'I want tea', color: 'tile-want' },
            { id: 'dr7', emoji: '🥃', text: 'ICE', speech: 'I want ice', color: 'tile-want' },
            { id: 'dr8', emoji: '🍺', text: 'BEER', speech: 'I want beer', color: 'tile-want' },
            { id: 'dr9', emoji: '🧋', text: 'SMOOTHIE', speech: 'I want a smoothie', color: 'tile-want' }
          ]
        },
        
        // JUICE OPTIONS - "I want juice" → "What kind of juice?"
        juice_options: {
          title: 'What kind of juice?',
          tiles: [
            { id: 'j1', emoji: '🍎', text: 'APPLE JUICE', speech: 'I want apple juice', color: 'tile-food-drinks' },
            { id: 'j2', emoji: '🍊', text: 'ORANGE JUICE', speech: 'I want orange juice', color: 'tile-food-drinks' },
            { id: 'j3', emoji: '🍇', text: 'GRAPE JUICE', speech: 'I want grape juice', color: 'tile-food-drinks' },
            { id: 'j4', emoji: '🍓', text: 'STRAWBERRY', speech: 'I want strawberry juice', color: 'tile-food-drinks' },
            { id: 'j5', emoji: '🍑', text: 'CHERRY JUICE', speech: 'I want cherry juice', color: 'tile-food-drinks' },
            { id: 'j6', emoji: '🍍', text: 'PINEAPPLE', speech: 'I want pineapple juice', color: 'tile-food-drinks' },
            { id: 'j7', emoji: '🍌', text: 'BANANA', speech: 'I want banana juice', color: 'tile-food-drinks' },
            { id: 'j8', emoji: '🍋', text: 'LEMON', speech: 'I want lemon juice', color: 'tile-food-drinks' },
            { id: 'j9', emoji: '🧃', text: 'MIXED JUICE', speech: 'I want mixed juice', color: 'tile-food-drinks' }
          ]
        },
        
        // SODA OPTIONS
        soda_options: {
          title: 'What kind of soda?',
          tiles: [
            { id: 's1', emoji: '🥤', text: 'COKE', speech: 'I want Coke', color: 'tile-want' },
            { id: 's2', emoji: '🥤', text: 'PEPSI', speech: 'I want Pepsi', color: 'tile-want' },
            { id: 's3', emoji: '🥤', text: 'SPRITE', speech: 'I want Sprite', color: 'tile-want' },
            { id: 's4', emoji: '🥤', text: 'ROOT BEER', speech: 'I want root beer', color: 'tile-want' },
            { id: 's5', emoji: '🥤', text: 'GINGER ALE', speech: 'I want ginger ale', color: 'tile-want' },
            { id: 's6', emoji: '🥤', text: 'DIET COKE', speech: 'I want diet Coke', color: 'tile-want' },
            { id: 's7', emoji: '🥤', text: 'DR PEPPER', speech: 'I want Dr Pepper', color: 'tile-want' },
            { id: 's8', emoji: '🥤', text: 'MOUNTAIN DEW', speech: 'I want Mountain Dew', color: 'tile-want' },
            { id: 's9', emoji: '🥤', text: 'ORANGE SODA', speech: 'I want orange soda', color: 'tile-want' }
          ]
        },
        
        // FOOD OPTIONS - "I want food" → "What kind of food?"
        food_options: {
          title: 'What kind of food?',
          tiles: [
            { id: 'fo1', emoji: '🍔', text: 'BURGER', speech: 'I want a burger', color: 'tile-want', subcategory: 'burger_options' },
            { id: 'fo2', emoji: '🍕', text: 'PIZZA', speech: 'I want pizza', color: 'tile-want', subcategory: 'pizza_options' },
            { id: 'fo3', emoji: '🌭', text: 'HOT DOG', speech: 'I want a hot dog', color: 'tile-want' },
            { id: 'fo4', emoji: '🍎', text: 'FRUIT', speech: 'I want fruit', color: 'tile-want', subcategory: 'fruit_options' },
            { id: 'fo5', emoji: '🥗', text: 'SALAD', speech: 'I want salad', color: 'tile-want' },
            { id: 'fo6', emoji: '🍝', text: 'PASTA', speech: 'I want pasta', color: 'tile-want' },
            { id: 'fo7', emoji: '🍗', text: 'CHICKEN', speech: 'I want chicken', color: 'tile-want' },
            { id: 'fo8', emoji: '🍟', text: 'FRIES', speech: 'I want fries', color: 'tile-want' },
            { id: 'fo9', emoji: '🍪', text: 'SNACK', speech: 'I want a snack', color: 'tile-want', subcategory: 'snack_options' }
          ]
        },
        
        // BURGER OPTIONS - "I want burger" → "What do you want on your burger?"
        burger_options: {
          title: 'What do you want on your burger?',
          tiles: [
            { id: 'b1', emoji: '🧀', text: 'CHEESE', speech: 'I want cheese on my burger', color: 'tile-want' },
            { id: 'b2', emoji: '🥓', text: 'BACON', speech: 'I want bacon on my burger', color: 'tile-want' },
            { id: 'b3', emoji: '🍅', text: 'TOMATO', speech: 'I want tomato on my burger', color: 'tile-want' },
            { id: 'b4', emoji: '🥬', text: 'LETTUCE', speech: 'I want lettuce on my burger', color: 'tile-want' },
            { id: 'b5', emoji: '🧅', text: 'ONION', speech: 'I want onion on my burger', color: 'tile-want' },
            { id: 'b6', emoji: '🥒', text: 'PICKLES', speech: 'I want pickles on my burger', color: 'tile-want' },
            { id: 'b7', emoji: '🍄', text: 'MUSHROOMS', speech: 'I want mushrooms on my burger', color: 'tile-want' },
            { id: 'b8', emoji: '🌶️', text: 'HOT SAUCE', speech: 'I want hot sauce on my burger', color: 'tile-want' },
            { id: 'b9', emoji: '🍔', text: 'PLAIN', speech: 'I want a plain burger', color: 'tile-want' }
          ]
        },
        
        // PIZZA OPTIONS
        pizza_options: {
          title: 'What kind of pizza?',
          tiles: [
            { id: 'pz1', emoji: '🍕', text: 'CHEESE', speech: 'I want cheese pizza', color: 'tile-want' },
            { id: 'pz2', emoji: '🍕', text: 'PEPPERONI', speech: 'I want pepperoni pizza', color: 'tile-want' },
            { id: 'pz3', emoji: '🍕', text: 'SAUSAGE', speech: 'I want sausage pizza', color: 'tile-want' },
            { id: 'pz4', emoji: '🍕', text: 'VEGGIE', speech: 'I want veggie pizza', color: 'tile-want' },
            { id: 'pz5', emoji: '🍕', text: 'HAWAIIAN', speech: 'I want Hawaiian pizza', color: 'tile-want' },
            { id: 'pz6', emoji: '🍕', text: 'MEAT LOVERS', speech: 'I want meat lovers pizza', color: 'tile-want' },
            { id: 'pz7', emoji: '🍕', text: 'MUSHROOM', speech: 'I want mushroom pizza', color: 'tile-want' },
            { id: 'pz8', emoji: '🍕', text: 'MARGHERITA', speech: 'I want margherita pizza', color: 'tile-want' },
            { id: 'pz9', emoji: '🍕', text: 'SUPREME', speech: 'I want supreme pizza', color: 'tile-want' }
          ]
        },
        
        // HOME ACTIVITIES - "Going home" → "Going home to do what?"
        home_activities: {
          title: 'Going home to do what?',
          tiles: [
            { id: 'ha1', emoji: '🛏️', text: 'SLEEP', speech: 'Going home to sleep', color: 'tile-action' },
            { id: 'ha2', emoji: '🍽️', text: 'EAT DINNER', speech: 'Going home to eat dinner', color: 'tile-action' },
            { id: 'ha3', emoji: '📺', text: 'WATCH TV', speech: 'Going home to watch TV', color: 'tile-action' },
            { id: 'ha4', emoji: '🎮', text: 'PLAY GAMES', speech: 'Going home to play games', color: 'tile-action' },
            { id: 'ha5', emoji: '🛁', text: 'TAKE BATH', speech: 'Going home to take a bath', color: 'tile-action' },
            { id: 'ha6', emoji: '📱', text: 'USE PHONE', speech: 'Going home to use my phone', color: 'tile-action' },
            { id: 'ha7', emoji: '🧸', text: 'PLAY WITH TOYS', speech: 'Going home to play with toys', color: 'tile-action' },
            { id: 'ha8', emoji: '📚', text: 'READ', speech: 'Going home to read', color: 'tile-action' },
            { id: 'ha9', emoji: '🎵', text: 'LISTEN TO MUSIC', speech: 'Going home to listen to music', color: 'tile-action' }
          ]
        },
        
        // PLAY OPTIONS - "I want to play" → "Play what?"
        play_options: {
          title: 'Play what?',
          tiles: [
            { id: 'pl1', emoji: '🎮', text: 'VIDEO GAMES', speech: 'I want to play video games', color: 'tile-want', subcategory: 'game_options' },
            { id: 'pl2', emoji: '⚽', text: 'SOCCER', speech: 'I want to play soccer', color: 'tile-want' },
            { id: 'pl3', emoji: '🏀', text: 'BASKETBALL', speech: 'I want to play basketball', color: 'tile-want' },
            { id: 'pl4', emoji: '🧩', text: 'PUZZLES', speech: 'I want to do puzzles', color: 'tile-want' },
            { id: 'pl5', emoji: '🃏', text: 'CARDS', speech: 'I want to play cards', color: 'tile-want' },
            { id: 'pl6', emoji: '🎲', text: 'BOARD GAMES', speech: 'I want to play board games', color: 'tile-want' },
            { id: 'pl7', emoji: '🧸', text: 'WITH TOYS', speech: 'I want to play with toys', color: 'tile-want' },
            { id: 'pl8', emoji: '🎪', text: 'PRETEND', speech: 'I want to play pretend', color: 'tile-want' },
            { id: 'pl9', emoji: '🏃', text: 'OUTSIDE', speech: 'I want to play outside', color: 'tile-want' }
          ]
        }
      
      };
    }
    
    // ========================================
    // ALL 42 MODULE IMPLEMENTATIONS
    // ========================================