'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface Rooms {
  [key: string]: string[];
}

export function PutAwayItems({ onClose }: { onClose: () => void }) {
  const { speak } = useSpeech();
  
  const rooms: Rooms = {
    'Kitchen 🍳': ['plate 🍽️', 'spoon 🥄', 'cup ☕', 'apple 🍎'],
    'Bedroom 🛏️': ['pillow 🛏️', 'pajamas 👔', 'book 📖', 'teddy bear 🧸'],
    'Bathroom 🚿': ['toothbrush 🪥', 'towel 🏠', 'soap 🧼', 'shampoo 🧴'],
    'Living Room 🛋️': ['remote 📺', 'cushion 🛋️', 'magazine 📰', 'toy car 🚗']
  };
  
  const [items, setItems] = useState<string[]>([]);
  const [sortedItems, setSortedItems] = useState<{[key: string]: string[]}>({});

  const startSorting = () => {
    // Mix items from all rooms
    const mixedItems = Object.values(rooms).flat().sort(() => Math.random() - 0.5);
    const initialSorted: {[key: string]: string[]} = {};
    Object.keys(rooms).forEach(room => initialSorted[room] = []);
    
    setItems(mixedItems);
    setSortedItems(initialSorted);
  };

  // Initialize game
  useState(() => {
    startSorting();
  });

  const selectItemToPutAway = (index: number) => {
    const item = items[index];
    // Find correct room for item
    const correctRoom = Object.keys(rooms).find(room => rooms[room].includes(item));
    
    if (correctRoom) {
      const newSortedItems = { ...sortedItems };
      newSortedItems[correctRoom] = [...newSortedItems[correctRoom], item];
      setSortedItems(newSortedItems);
      
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
      
      speak('Good job! ' + item + ' goes in the ' + correctRoom + '!');
    }
  };

  const resetPutAwayGame = () => {
    startSorting();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(4px)',
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '30px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        color: 'white',
        position: 'relative',
        margin: '30px 0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>📦 Put Away Items</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✖
          </button>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '16px' }}>Click items to put them in the correct room!</p>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '24px'
          }}>
            <h4 style={{ fontSize: '18px', marginBottom: '12px', fontWeight: '600' }}>Items to put away:</h4>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              minHeight: '48px'
            }}>
              {items.map((item, index) => (
                <div
                  key={index}
                  onClick={() => selectItemToPutAway(index)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {Object.keys(rooms).map(room => (
              <div 
                key={room}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '2px dashed rgba(255,255,255,0.3)',
                  padding: '16px',
                  borderRadius: '10px'
                }}
              >
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>{room}</h4>
                <div style={{ minHeight: '64px' }}>
                  {sortedItems[room]?.map((item, index) => (
                    <div 
                      key={index}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '4px 8px',
                        margin: '4px 0',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {items.length === 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '20px', marginBottom: '16px' }}>🎉 Great job! All items are put away!</h4>
              <button 
                onClick={resetPutAwayGame}
                style={{
                  background: 'rgba(34, 197, 94, 0.3)',
                  border: 'none',
                  color: 'white',
                  padding: '15px 30px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.5)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)'}
              >
                🔄 Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}