`# Strands Game - Setup & Usage Guide

## 🎮 Game Overview

A NYT Strands-like word puzzle game with:
- 6×8 interactive grid
- Theme-based word finding
- Spangram spanning opposite edges
- Hint system (3 non-theme words = 1 hint)
- Reward system (discount codes, badges)
- Auto-grid generation from theme words

## 📋 Quick Start

### 1. Start Development Server

```bash
cd /Users/groot/Documents/code/nm-sanity-strands-game
npm run dev
```

### 2. Access Sanity Studio

Navigate to: `http://localhost:3000/cms`

### 3. Create Your First Puzzle

1. Click **"Create"** → **"Strands Puzzle"**

2. Fill in **Puzzle Tab**:
   - **Title**: "Strands #1" or "Beach Day"
   - **Slug**: Auto-generated from title
   - **Grid Creation Mode**: "✨ Auto-generate from words" (recommended)

3. Add **Theme Words**:
   Click **"Add item"** for each word:

   **Beach Theme Example:**
   - SAND (Easy)
   - WAVE (Easy)
   - SHELL (Medium)
   - TIDE (Easy)
   - CORAL (Medium)
   - SEASHORE (Medium) → ✅ **Check "This is the Spangram"**

   > **Important**: Exactly ONE word must be marked as Spangram!

4. **Generate Grid**:
   - Click the **"Generate Grid from Words"** button
   - Wait for generation (usually 1-2 seconds)
   - You'll see: "✓ Grid Generated & Locked" with hint word count
   - Grid will appear in the "Generated Grid" field below

5. Set **Theme** (below grid):
   - **Category**: "Things you find at the beach"
   - **Clue**: "Where waves meet sand" (can be cryptic)
   - **Emoji**: 🏖️ (optional)

6. Go to **Gameplay Settings** tab:
   - **Difficulty**: Medium
   - **Hint System**: "Category hint + 3-word accumulator"
   - **Time Limit**: 0 (unlimited)
   - **Scoring**: Default (10 points/word, 50 bonus for spangram)

7. Optional: **Completion Reward**:
   - Enable Reward: ✅
   - Type: "Discount Code"
   - Code: "BEACH10"
   - Percentage: 10%
   - Message: "Enjoy 10% off your next order!"

8. Go to **Metadata** tab:
   - **Status**: "🚀 Published"
   - **Puzzle Number**: 1

9. Click **"Publish"**

### 4. Play the Game

Visit: `http://localhost:3000/games/strands-1` (or your slug)

## 🎯 Sample Puzzles

### Puzzle 1: Beach Theme
```text
Theme Words:
- SAND, WAVE, SHELL, TIDE, CORAL
- Spangram: SEASHORE

Clue: "Where waves meet sand"
Difficulty: Medium
```

### Puzzle 2: Sports Theme
```text
Theme Words:
- BALL, GOAL, TEAM, PLAY, SCORE
- Spangram: ATHLETE

Clue: "Playing fields and competition"
Difficulty: Easy
```

### Puzzle 3: Coffee Theme
```text
Theme Words:
- BREW, BEAN, LATTE, ROAST, STEAM
- Spangram: ESPRESSO

Clue: "Morning pick-me-up"
Difficulty: Hard
```

## 🎮 How to Play

1. **Select Letters**: Click or drag across adjacent letters
2. **Submit Word**: Release mouse or press Enter
3. **Clear Selection**: Press ESC or click "Clear"
4. **Earn Hints**: Find 3 non-theme words (4+ letters) = 1 hint
5. **Win**: Find all theme words including the spangram!

### Game Rules:
- Letters must be adjacent (including diagonals)
- Each letter used only once per word
- Spangram MUST span opposite edges
- Green = found theme word
- Yellow = spangram

## 🔧 Troubleshooting

### Grid Generation Fails
- **Ensure ONE spangram is marked** (not zero, not multiple)
- **Spangram should be 6+ letters** for better placement
- **Theme words should vary in length** (mix of 4-8 letter words)
- **Try again**: Click "Unlock & Regenerate"

### Grid Has Too Few Hints
The algorithm targets 15+ hint words. If you get a warning:
- **Regenerate** the grid (may get better result)
- **Adjust word list** (different words may yield more hints)
- **Accept lower count** (10+ is still playable)

### Game Not Loading
- Check puzzle status is "Published"
- Verify slug matches URL
- Check expiry date hasn't passed
- Look for console errors

## 📊 Testing Checklist

- [ ] Grid generates successfully (47+ hint words is great!)
- [ ] All theme words are in grid
- [ ] Spangram spans edges correctly
- [ ] Click/drag selection works
- [ ] Found words turn green
- [ ] Spangram turns yellow
- [ ] Hint system accumulates (3 words = 1 hint)
- [ ] Game completes when all words found
- [ ] Reward displays if configured
- [ ] Local storage saves progress

## 🚀 Production Deployment

Before going live:

1. **Create multiple puzzles** (10+ recommended)
2. **Set puzzle numbers** sequentially
3. **Schedule releases** using publishDate
4. **Test on mobile** (touch interactions)
5. **Add to navigation** (optional: create games listing page)
6. **Share puzzles** on social media

## 📝 Advanced Features

### Manual Grid Entry
Instead of auto-generation, you can:
1. Set mode to "✏️ Manual grid entry"
2. Enter 48 uppercase letters directly
3. Ensure your words fit in the grid manually

### Time Challenges
- Set **Time Limit** to 5-15 minutes
- Adds urgency and competition
- Shows countdown timer

### Difficulty Tuning
- **Easy**: Common 4-5 letter words
- **Medium**: Mix of lengths, some uncommon
- **Hard**: Long words (7-8 letters), obscure vocabulary

## 🎨 Customization Ideas

- **Daily Puzzle**: Create new puzzle each day
- **Themed Series**: "Coffee Week", "Ocean Month"
- **Leaderboards**: Track fastest completion times
- **Social Sharing**: "I solved Strands #42 in 3:45!"
- **Difficulty Badges**: Award badges for hard puzzles

---

Happy puzzle creating! 🎉
