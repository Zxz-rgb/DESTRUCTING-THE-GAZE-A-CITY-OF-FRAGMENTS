// Puzzle Game JavaScript
class PuzzleGame {
    constructor() {
        this.currentPattern = 1;
        this.totalPatterns = 5;
        this.puzzlePieces = [];
        this.gameStartTime = Date.now();
        this.placedPieces = 0;
        this.totalPieces = 9;
        this.gameTimer = null;
        
        this.init();
    }

    init() {
        this.setupDOM();
        this.setupEventListeners();
        this.createPuzzleGrid();
        this.loadPattern(this.currentPattern);
        this.startTimer();
    }

    setupDOM() {
        this.puzzleGrid = document.getElementById('puzzleGrid');
        this.fragmentsPool = document.getElementById('fragmentsPool');
        this.placedCountEl = document.getElementById('placedCount');
        this.timeElapsedEl = document.getElementById('timeElapsed');
        this.completionOverlay = document.getElementById('completionOverlay');
    }

    setupEventListeners() {
        // Pattern selection buttons
        document.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pattern = parseInt(e.target.dataset.pattern);
                this.selectPattern(pattern);
            });
        });

        // Control buttons
        document.getElementById('shuffleBtn').addEventListener('click', () => {
            this.shuffleFragments();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetPuzzle();
        });

        document.getElementById('returnBtn').addEventListener('click', () => {
            window.location.href = 'hongkong.html';
        });

        document.getElementById('nextPatternBtn').addEventListener('click', () => {
            this.nextPattern();
        });

        document.getElementById('backToPortfolioBtn').addEventListener('click', () => {
            window.location.href = 'hongkong.html';
        });
    }

    createPuzzleGrid() {
        this.puzzleGrid.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.className = 'puzzle-slot';
            slot.dataset.position = i;
            
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.style.background = '#333333';
            });

            slot.addEventListener('dragleave', () => {
                if (!slot.classList.contains('occupied')) {
                    slot.style.background = '#1a1a1a';
                }
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                this.handlePieceDrop(e, slot);
            });

            slot.addEventListener('click', () => {
                this.handleSlotClick(slot);
            });

            this.puzzleGrid.appendChild(slot);
        }
    }

    createFragmentsPool() {
        this.fragmentsPool.innerHTML = '';
        
        // Create shuffled array of fragment indices
        const fragmentIndices = Array.from({length: 9}, (_, i) => i);
        this.shuffleArray(fragmentIndices);

        fragmentIndices.forEach((fragmentIndex, poolIndex) => {
            const fragmentSlot = document.createElement('div');
            fragmentSlot.className = 'fragment-slot';
            
            const piece = document.createElement('img');
            piece.className = 'fragment-piece';
            piece.src = `hongkong/minigame/photos/pattern0${this.currentPattern}_piece_${fragmentIndex}.png`;
            piece.dataset.correctPosition = fragmentIndex;
            piece.dataset.currentPool = poolIndex;
            piece.draggable = true;

            // Drag events
            piece.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    correctPosition: fragmentIndex,
                    currentPool: poolIndex,
                    source: 'pool'
                }));
                piece.classList.add('dragging');
            });

            piece.addEventListener('dragend', () => {
                piece.classList.remove('dragging');
            });

            // Click to select
            piece.addEventListener('click', () => {
                this.selectFragment(piece);
            });

            fragmentSlot.appendChild(piece);
            this.fragmentsPool.appendChild(fragmentSlot);
        });
    }

    selectPattern(patternNum) {
        // Update active button
        document.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-pattern="${patternNum}"]`).classList.add('active');

        this.currentPattern = patternNum;
        this.resetPuzzle();
        this.loadPattern(patternNum);
    }

    loadPattern(patternNum) {
        // Check if pattern images exist, if not create placeholder logic
        this.createFragmentsPool();
        this.updateStats();
    }

    handlePieceDrop(event, targetSlot) {
        const data = JSON.parse(event.dataTransfer.getData('text/plain'));
        const correctPosition = parseInt(data.correctPosition);
        const targetPosition = parseInt(targetSlot.dataset.position);

        // Remove highlighting
        targetSlot.style.background = '';

        // Check if position is correct
        if (correctPosition === targetPosition) {
            this.placePiece(targetSlot, data);
        } else {
            // Incorrect placement - visual feedback
            this.showIncorrectPlacement(targetSlot);
        }
    }

    handleSlotClick(slot) {
        if (this.selectedFragment) {
            const correctPosition = parseInt(this.selectedFragment.dataset.correctPosition);
            const targetPosition = parseInt(slot.dataset.position);

            if (correctPosition === targetPosition) {
                this.placePiece(slot, {
                    correctPosition: correctPosition,
                    currentPool: this.selectedFragment.dataset.currentPool,
                    source: 'pool'
                });
                this.clearSelection();
            } else {
                this.showIncorrectPlacement(slot);
            }
        }
    }

    selectFragment(piece) {
        // Clear previous selection
        this.clearSelection();
        
        // Select new fragment
        this.selectedFragment = piece;
        piece.style.border = '3px solid #ffff00';
        piece.style.transform = 'scale(1.1)';
    }

    clearSelection() {
        if (this.selectedFragment) {
            this.selectedFragment.style.border = '2px solid #666666';
            this.selectedFragment.style.transform = '';
            this.selectedFragment = null;
        }
    }

    placePiece(targetSlot, data) {
        if (targetSlot.classList.contains('occupied')) {
            return; // Slot already occupied
        }

        // Create piece for puzzle grid
        const piece = document.createElement('img');
        piece.className = 'puzzle-piece';
        piece.src = `hongkong/minigame/photos/pattern0${this.currentPattern}_piece_${data.correctPosition}.png`;
        piece.dataset.correctPosition = data.correctPosition;

        // Remove from pool
        const poolSlots = this.fragmentsPool.querySelectorAll('.fragment-slot');
        const poolSlot = poolSlots[data.currentPool];
        if (poolSlot && poolSlot.firstChild) {
            poolSlot.removeChild(poolSlot.firstChild);
        }

        // Add to puzzle grid
        targetSlot.appendChild(piece);
        targetSlot.classList.add('occupied');
        
        // Update stats
        this.placedPieces++;
        this.updateStats();

        // Check completion
        if (this.placedPieces === this.totalPieces) {
            setTimeout(() => {
                this.completePattern();
            }, 500);
        }

        // Visual feedback
        this.showCorrectPlacement(targetSlot);
    }

    showCorrectPlacement(slot) {
        slot.style.background = '#2a5a2a';
        slot.style.borderColor = '#4a8a4a';
        setTimeout(() => {
            slot.style.background = '#2a2a2a';
            slot.style.borderColor = '#777777';
        }, 1000);
    }

    showIncorrectPlacement(slot) {
        slot.style.background = '#5a2a2a';
        slot.style.borderColor = '#8a4a4a';
        setTimeout(() => {
            slot.style.background = '#1a1a1a';
            slot.style.borderColor = '#444444';
        }, 1000);
    }

    shuffleFragments() {
        this.createFragmentsPool();
    }

    resetPuzzle() {
        // Clear puzzle grid
        document.querySelectorAll('.puzzle-slot').forEach(slot => {
            slot.innerHTML = '';
            slot.classList.remove('occupied');
            slot.style.background = '';
            slot.style.borderColor = '';
        });

        // Reset stats
        this.placedPieces = 0;
        this.gameStartTime = Date.now();
        this.updateStats();
        this.clearSelection();

        // Recreate fragments pool
        if (this.currentPattern) {
            this.createFragmentsPool();
        }
    }

    completePattern() {
        // Stop timer
        clearInterval(this.gameTimer);
        
        // Show completion overlay
        this.completionOverlay.style.display = 'flex';
        
        // Update next pattern button
        const nextBtn = document.getElementById('nextPatternBtn');
        if (this.currentPattern >= this.totalPatterns) {
            nextBtn.textContent = 'ALL PATTERNS COMPLETED';
            nextBtn.disabled = true;
        } else {
            nextBtn.textContent = 'NEXT PATTERN';
            nextBtn.disabled = false;
        }
    }

    nextPattern() {
        this.completionOverlay.style.display = 'none';
        
        if (this.currentPattern < this.totalPatterns) {
            this.selectPattern(this.currentPattern + 1);
            this.startTimer();
        }
    }

    updateStats() {
        this.placedCountEl.textContent = `${this.placedPieces} / ${this.totalPieces}`;
    }

    startTimer() {
        this.gameStartTime = Date.now();
        this.gameTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            this.timeElapsedEl.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Image Processing Functions
class ImageProcessor {
    static async splitImageIntoPieces(imagePath, patternNumber) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const pieceWidth = this.width / 3;
                const pieceHeight = this.height / 3;
                
                const pieces = [];
                
                for (let row = 0; row < 3; row++) {
                    for (let col = 0; col < 3; col++) {
                        const pieceCanvas = document.createElement('canvas');
                        pieceCanvas.width = pieceWidth;
                        pieceCanvas.height = pieceHeight;
                        const pieceCtx = pieceCanvas.getContext('2d');
                        
                        pieceCtx.drawImage(
                            this,
                            col * pieceWidth, row * pieceHeight,
                            pieceWidth, pieceHeight,
                            0, 0,
                            pieceWidth, pieceHeight
                        );
                        
                        pieces.push(pieceCanvas.toDataURL());
                    }
                }
                
                resolve(pieces);
            };
            img.src = imagePath;
        });
    }
    
    static async processPatternsFromUpload() {
        // This would be called when images are uploaded
        // For now, we'll assume the pieces already exist
        console.log('Image processing would happen here');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.puzzleGame = new PuzzleGame();
});

// Handle image processing if needed
window.ImageProcessor = ImageProcessor;