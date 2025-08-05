'use client';

import { useState } from 'react';
import { useSpeech } from '@/hooks/useSpeech';

interface Scene {
  name: string;
  complete: string[];
  missing: MissingItem[];
}

interface MissingItem {
  items: string[];
  answer: string;
  question: string;
}

export function WhatsMissing({ onClose }: { onClose: () => void }) {
  const { speak } = useSpeech();
  
  const scenes: Scene[] = [
    { 
      name: 'Face', 
      complete: ['👁️', '👁️', '👃', '👄'], 
      missing: [
        { items: ['👁️', '👃', '👄'], answer: '👁️', question: 'What\'s missing from this face?' },
        { items: ['👁️', '👁️', '👄'], answer: '👃', question: 'What\'s missing from this face?' },
        { items: ['👁️', '👁️', '👃'], answer: '👄', question: 'What\'s missing from this face?' }
      ]
    },
    {
      name: 'Car',
      complete: ['🚗', '⚙️', '🛞', '🛞'],
      missing: [
        { items: ['🚗', '⚙️', '🛞'], answer: '🛞', question: 'What\'s missing from this car?' }
      ]
    }
  ];
  
  const [currentScene, setCurrentScene] = useState(0);
  const [currentMissing, setCurrentMissing] = useState(0);
  const [options, setOptions] = useState<string[]>([]);

  const generateOptions = () => {
    const scene = scenes[currentScene];
    const missing = scene.missing[currentMissing];
    let newOptions = [...scene.complete, '🎈', '📱'].sort(() => Math.random() - 0.5).slice(0, 4);
    
    // Make sure the correct answer is included
    if (!newOptions.includes(missing.answer)) {
      newOptions[0] = missing.answer;
    }
    
    setOptions(newOptions);
  };

  // Initialize game
  useState(() => {
    generateOptions();
  });

  const selectMissing = (selected: string) => {
    const scene = scenes[currentScene];
    const missing = scene.missing[currentMissing];
    
    if (selected === missing.answer) {
      speak('Correct! ' + missing.answer + ' was missing!');
      
      // Move to next missing item or scene
      setTimeout(() => {
        let newCurrentMissing = currentMissing + 1;
        let newCurrentScene = currentScene;
        
        if (newCurrentMissing >= scene.missing.length) {
          newCurrentScene = currentScene + 1;
          newCurrentMissing = 0;
          if (newCurrentScene >= scenes.length) {
            newCurrentScene = 0; // Reset to beginning
          }
        }
        
        setCurrentScene(newCurrentScene);
        setCurrentMissing(newCurrentMissing);
        
        // Regenerate options for new scene/missing
        setTimeout(generateOptions, 100);
      }, 1500);
    } else {
      speak('Not quite! Keep looking!');
    }
  };

  const scene = scenes[currentScene];
  const missing = scene.missing[currentMissing];

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
      backdropFilter: 'blur(4px)'
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
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>🔍 What&apos;s Missing?</h2>
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
          <p style={{ marginBottom: '24px', fontSize: '18px' }}>{missing.question}</p>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '20px',
            borderRadius: '15px',
            marginBottom: '24px',
            maxWidth: '300px',
            margin: '0 auto 24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {missing.items.map((item, index) => (
                <div key={index} style={{ fontSize: '60px', margin: '4px' }}>{item}</div>
              ))}
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px dashed rgba(255,255,255,0.5)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '60px',
                margin: '4px'
              }}>
                ?
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            maxWidth: '250px',
            margin: '0 auto'
          }}>
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => selectMissing(option)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  fontSize: '50px',
                  padding: '15px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}