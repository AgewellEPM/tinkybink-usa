'use client';

import { WhichOneDoesntBelong } from '@/components/games/WhichOneDoesntBelong';
import { MatchTheSame } from '@/components/games/MatchTheSame';
import { MakeASandwich } from '@/components/games/MakeASandwich';
import { PickTheColor } from '@/components/games/PickTheColor';
import { PutAwayItems } from '@/components/games/PutAwayItems';
import { YesOrNoGame } from '@/components/games/YesOrNoGame';
import { SoundMatching } from '@/components/games/SoundMatching';
import { WhatsMissing } from '@/components/games/WhatsMissing';
import { DailyRoutineBuilder } from '@/components/games/DailyRoutineBuilder';
import { FirstLetterMatch } from '@/components/games/FirstLetterMatch';
import { SequenceBuilder } from '@/components/games/SequenceBuilder';
import { WhatComesNext } from '@/components/games/WhatComesNext';
import { MatchEmotion } from '@/components/games/MatchEmotion';
import { SayTheSentence } from '@/components/games/SayTheSentence';
import { WhatDoYouWear } from '@/components/games/WhatDoYouWear';

interface GameModalProps {
  gameType: string | null;
  onClose: () => void;
}

export function GameModal({ gameType, onClose }: GameModalProps) {
  if (!gameType) return null;

  const gameComponents = {
    whichOne: WhichOneDoesntBelong,
    matchSame: MatchTheSame,
    makeSandwich: MakeASandwich,
    pickColor: PickTheColor,
    putAway: PutAwayItems,
    yesNo: YesOrNoGame,
    soundMatch: SoundMatching,
    whatsMissing: WhatsMissing,
    routineBuilder: DailyRoutineBuilder,
    firstLetterMatch: FirstLetterMatch,
    sequenceBuilder: SequenceBuilder,
    whatComesNext: WhatComesNext,
    matchEmotion: MatchEmotion,
    sayTheSentence: SayTheSentence,
    whatDoYouWear: WhatDoYouWear,
  };

  const GameComponent = gameComponents[gameType as keyof typeof gameComponents];
  
  if (!GameComponent) return null;

  return <GameComponent onClose={onClose} />;
}