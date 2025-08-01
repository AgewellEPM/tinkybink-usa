import React, { useState } from 'react';

interface StoryStep {
  label: string;
  emoji: string;
  text: string;
}

interface VisualStoryBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORY_TEMPLATES = {
  morning: [
    { label: 'WAKE UP', emoji: '⏰', text: 'Time to wake up' },
    { label: 'BATHROOM', emoji: '🚽', text: 'Use the bathroom' },
    { label: 'BRUSH TEETH', emoji: '🦷', text: 'Brush my teeth' },
    { label: 'GET DRESSED', emoji: '👔', text: 'Put on clothes' },
    { label: 'BREAKFAST', emoji: '🥞', text: 'Eat breakfast' }
  ],
  school: [
    { label: 'BACKPACK', emoji: '🎒', text: 'Get my backpack' },
    { label: 'SHOES', emoji: '👟', text: 'Put on shoes' },
    { label: 'BUS', emoji: '🚌', text: 'Ride the bus' },
    { label: 'CLASSROOM', emoji: '🏫', text: 'Go to class' }
  ],
  bedtime: [
    { label: 'PAJAMAS', emoji: '🩳', text: 'Put on pajamas' },
    { label: 'BRUSH TEETH', emoji: '🦷', text: 'Brush teeth' },
    { label: 'STORY', emoji: '📚', text: 'Read a story' },
    { label: 'SLEEP', emoji: '😴', text: 'Go to sleep' }
  ],
  doctor: [
    { label: 'WAIT', emoji: '⏰', text: 'Wait in waiting room' },
    { label: 'NAME', emoji: '📢', text: 'Nurse calls my name' },
    { label: 'CHECK', emoji: '🩺', text: 'Doctor checks me' },
    { label: 'ALL DONE', emoji: '✅', text: 'Visit is finished' }
  ],
  playground: [
    { label: 'WALK', emoji: '🚶', text: 'Walk to playground' },
    { label: 'PLAY', emoji: '🎮', text: 'Play with friends' },
    { label: 'SHARE', emoji: '🤝', text: 'Share toys' },
    { label: 'CLEAN UP', emoji: '🧹', text: 'Clean up toys' }
  ],
  eating: [
    { label: 'WASH HANDS', emoji: '🧼', text: 'Wash my hands' },
    { label: 'SIT DOWN', emoji: '🪑', text: 'Sit at the table' },
    { label: 'EAT', emoji: '🍽️', text: 'Eat my food' },
    { label: 'CLEAN UP', emoji: '🧽', text: 'Clean my place' }
  ]
};

export const VisualStoryBuilder: React.FC<VisualStoryBuilderProps> = ({ isOpen, onClose }) => {
  const [storyType, setStoryType] = useState('sequence');
  const [storyTitle, setStoryTitle] = useState('My Visual Story');
  const [storySteps, setStorySteps] = useState<StoryStep[]>([
    { label: 'FIRST', emoji: '1️⃣', text: '' },
    { label: 'THEN', emoji: '2️⃣', text: '' },
    { label: 'NEXT', emoji: '3️⃣', text: '' }
  ]);

  if (!isOpen) return null;

  const updateStoryTemplate = (type: string) => {
    setStoryType(type);
    
    if (type === 'sequence') {
      setStorySteps([
        { label: 'FIRST', emoji: '1️⃣', text: '' },
        { label: 'THEN', emoji: '2️⃣', text: '' },
        { label: 'NEXT', emoji: '3️⃣', text: '' }
      ]);
    } else if (type === 'choice') {
      setStorySteps([
        { label: 'CHOICE 1', emoji: '🔵', text: '' },
        { label: 'CHOICE 2', emoji: '🔴', text: '' }
      ]);
    }
  };

  const loadTemplate = (templateName: keyof typeof STORY_TEMPLATES) => {
    setStorySteps([...STORY_TEMPLATES[templateName]]);
  };

  const addStep = () => {
    setStorySteps([...storySteps, {
      label: `Step ${storySteps.length + 1}`,
      emoji: '📌',
      text: ''
    }]);
  };

  const removeStep = (index: number) => {
    setStorySteps(storySteps.filter((_, i) => i !== index));
  };

  const updateStepText = (index: number, text: string) => {
    const newSteps = [...storySteps];
    newSteps[index].text = text;
    setStorySteps(newSteps);
  };

  const selectStepEmoji = (index: number) => {
    const emoji = prompt('Enter emoji for this step:', storySteps[index].emoji);
    if (emoji) {
      const newSteps = [...storySteps];
      newSteps[index].emoji = emoji;
      setStorySteps(newSteps);
    }
  };

  const printStory = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${storyTitle} - Visual Story</title>
        <style>
          @page { size: landscape; margin: 0.5in; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .story-header { text-align: center; margin-bottom: 30px; }
          .story-title { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
          .story-steps { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
          .story-card {
            border: 3px solid #333;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            width: 200px;
            page-break-inside: avoid;
          }
          .step-label { font-size: 14px; font-weight: bold; color: #666; margin-bottom: 10px; }
          .step-emoji { font-size: 72px; margin: 20px 0; }
          .step-text { font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="story-header">
          <div class="story-title">${storyTitle}</div>
          <div style="color: #666;">Visual Story Guide</div>
        </div>
        
        <div class="story-steps">
          ${storySteps.map(step => `
            <div class="story-card">
              <div class="step-label">${step.label}</div>
              <div class="step-emoji">${step.emoji}</div>
              <div class="step-text">${step.text}</div>
            </div>
          `).join('')}
        </div>
        
        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
          <p>Created with TinkyBink AAC • ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="modal" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '900px', width: '95%' }}>
        <div className="modal-header">
          <h2>📚 Visual Story Builder</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        
        <div style={{ padding: '20px' }}>
          <div className="setting-group">
            <label>Story Type:</label>
            <select 
              value={storyType}
              onChange={(e) => updateStoryTemplate(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                background: 'rgba(255,255,255,0.1)', 
                color: 'white', 
                border: '1px solid var(--primary-color)', 
                borderRadius: '4px' 
              }}
            >
              <option value="sequence">First/Then/Next Sequence</option>
              <option value="social">Social Story</option>
              <option value="routine">Daily Routine</option>
              <option value="choice">Choice Board</option>
              <option value="emotion">Emotion Regulation</option>
            </select>
          </div>
          
          <div className="setting-group">
            <label>Story Title:</label>
            <input 
              type="text" 
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder="My Visual Story" 
              style={{ 
                width: '100%', 
                padding: '10px', 
                background: 'rgba(255,255,255,0.1)', 
                color: 'white', 
                border: '1px solid var(--primary-color)', 
                borderRadius: '4px' 
              }}
            />
          </div>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '8px', 
            padding: '20px', 
            margin: '20px 0' 
          }}>
            <h4>Story Steps:</h4>
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              overflowX: 'auto', 
              padding: '15px 0', 
              minHeight: '150px' 
            }}>
              {storySteps.map((step, index) => (
                <div 
                  key={index}
                  style={{ 
                    minWidth: '150px', 
                    background: 'rgba(255,255,255,0.1)', 
                    border: '2px solid var(--primary-color)', 
                    borderRadius: '8px', 
                    padding: '15px', 
                    textAlign: 'center' 
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                    {step.label}
                  </div>
                  <div 
                    style={{ fontSize: '48px', margin: '10px 0', cursor: 'pointer' }}
                    onClick={() => selectStepEmoji(index)}
                  >
                    {step.emoji}
                  </div>
                  <input 
                    type="text" 
                    value={step.text} 
                    placeholder="Add text..."
                    onChange={(e) => updateStepText(index, e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '5px', 
                      background: 'rgba(255,255,255,0.1)', 
                      color: 'white', 
                      border: '1px solid rgba(255,255,255,0.3)', 
                      borderRadius: '4px', 
                      textAlign: 'center' 
                    }}
                  />
                  <button 
                    onClick={() => removeStep(index)}
                    style={{ 
                      marginTop: '5px', 
                      background: 'var(--danger-color)', 
                      color: 'white', 
                      border: 'none', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button 
              onClick={addStep}
              className="action-btn" 
              style={{ marginTop: '15px', background: 'var(--primary-color)' }}
            >
              ➕ Add Step
            </button>
          </div>
          
          <div className="setting-group">
            <h4>Quick Templates:</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
              gap: '10px' 
            }}>
              <button onClick={() => loadTemplate('morning')} className="action-btn secondary">
                🌅 Morning Routine
              </button>
              <button onClick={() => loadTemplate('school')} className="action-btn secondary">
                🎒 Going to School
              </button>
              <button onClick={() => loadTemplate('bedtime')} className="action-btn secondary">
                🛏️ Bedtime Routine
              </button>
              <button onClick={() => loadTemplate('doctor')} className="action-btn secondary">
                🏥 Doctor Visit
              </button>
              <button onClick={() => loadTemplate('playground')} className="action-btn secondary">
                🎮 Playground Rules
              </button>
              <button onClick={() => loadTemplate('eating')} className="action-btn secondary">
                🍽️ Mealtime Steps
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              onClick={() => alert(`Preview: ${storyTitle}\n\n${storySteps.map((s, i) => `${i + 1}. ${s.emoji} ${s.text}`).join('\n')}`)}
              style={{ 
                flex: 1, 
                padding: '12px', 
                background: 'var(--primary-color)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '16px', 
                cursor: 'pointer' 
              }}
            >
              👁️ Preview Story
            </button>
            <button 
              onClick={printStory}
              style={{ 
                flex: 1, 
                padding: '12px', 
                background: 'var(--success-color)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '16px', 
                cursor: 'pointer' 
              }}
            >
              🖨️ Print Story
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};