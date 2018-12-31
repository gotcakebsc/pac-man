class CharacterUtil {
    constructor() {
        this.directions = {
            up: 'up',
            down: 'down',
            left: 'left',
            right: 'right'
        }
    }

    /**
     * Check if a given character has moved more than five in-game tiles during a frame.
     * If so, we want to temporarily hide the object to avoid 'animation stutter'.
     * @param {({top: number, left: number})} position - The character's position during the current frame
     * @param {({top: number, left: number})} oldPosition - The character's position during the previous frame
     * 
     * @returns {('hidden'|'visible')} - The new 'visibility' css property value for the character.
     */
    checkForStutter(position, oldPosition) {
        let stutter = false;
        const threshold = 5;

        if (position && oldPosition) {
            if (Math.abs(position['top'] - oldPosition['top']) > threshold || Math.abs(position['left'] - oldPosition['left']) > threshold) {
                stutter = true;
            }
        }

        return stutter ? 'hidden' : 'visible';
    }

    /**
     * Check which CSS property needs to be changed given the character's current direction
     * @param {('up'|'down'|'left'|'right')} direction - The direction the character is currently traveling in
     * 
     * @returns {('top'|'left')}
     */
    getPropertyToChange(direction) {
        switch(direction) {
            case this.directions.up:
            case this.directions.down:
                return 'top';
            default:
                return 'left';
        }
    }

    /**
     * Calculate the velocity for the character's next frame.
     * @param {('up'|'down'|'left'|'right')} direction - The direction the character is currently traveling in
     * @param {number} velocityPerMs - The distance the character should travel in a single millisecond
     * 
     * @returns {number} - New velocity. Since we are using css positioning, moving down or right is positive, while up or left is negative.
     */
    getVelocity(direction, velocityPerMs) {
        switch(direction) {
            case this.directions.up:
            case this.directions.left:
                return velocityPerMs * -1;
            default:
                return velocityPerMs;
        }
    }

    /**
     * Determine the next value which will be used to draw the character's position on screen
     * @param {number} interp - The percentage of the desired timestamp between frames
     * @param {('top'|'left')} prop - The css property to be changed
     * @param {({top: number, left: number})} oldPosition - The character's position during the previous frame
     * @param {({top: number, left: number})} position - The character's position during the current frame
     * 
     * @returns {number} - New value for css positioning
     */
    calculateNewDrawValue(interp, prop, oldPosition, position) {
        return oldPosition[prop] + (position[prop] - oldPosition[prop]) * interp;
    }

    /**
     * Convert the character's css position to a row-column on the maze array
     * @param {*} position - The character's position during the current frame
     * @param {*} scaledTileSize - The dimensions of a single tile
     * 
     * @returns {({x: number, y: number})}
     */
    determineGridPosition(position, scaledTileSize) {
        return {
            x : (position.left / scaledTileSize) + 0.5,
            y : (position.top / scaledTileSize) + 0.5
        };
    }

    /**
     * Check to see if a character's disired direction results in turning around
     * @param {('up'|'down'|'left'|'right')} direction - The direction the character is currently traveling in
     * @param {('up'|'down'|'left'|'right')} desiredDirection - The direction the character wants to be traveling in
     * 
     * @returns {boolean}
     */
    turningAround(direction, desiredDirection) {
        return desiredDirection === this.getOppositeDirection(direction);
    }

    /**
     * Calculate the opposite of a given direction
     * @param {('up'|'down'|'left'|'right')} direction - The direction the character is currently traveling in 
     * 
     * @returns {('up'|'down'|'left'|'right')}
     */
    getOppositeDirection(direction) {
        switch(direction) {
            case this.directions.up:
                return this.directions.down;
            case this.directions.down:
                return this.directions.up;
            case this.directions.left:
                return this.directions.right;
            default:
                return this.directions.left;
        }
    }

    /**
     * Calculate the proper rounding function, given the character's current direction, to assist with collision detection
     * @param {('up'|'down'|'left'|'right')} direction - The direction the character is currently traveling in 
     * 
     * @returns {Function}
     */
    determineRoundingFunction(direction) {
        switch(direction) {
            case this.directions.up:
            case this.directions.left:
                return Math.floor;
            default:
                return Math.ceil;
        } 
    }

    /**
     * Check to see if the character's next frame results in moving to a new tile on the maze array
     * @param {({x: number, y: number})} oldPosition - The character's position during the previous frame
     * @param {({x: number, y: number})} position - The character's position during the current frame
     * 
     * @returns {boolean}
     */
    changingGridPosition(oldPosition, position) {
        return (
            Math.floor(oldPosition.x) !== Math.floor(position.x) ||
            Math.floor(oldPosition.y) !== Math.floor(position.y)
        );
    }

    /**
     * Check to see if the character is attempting to run into a wall of the maze
     * @param {({x: number, y: number})} desiredNewGridPosition - The tile on the maze that the character wishes to move to
     * @param {Array} mazeArray - The 2D array representing the game's maze
     * @param {('up'|'down'|'left'|'right')} direction - The direction the character is currently traveling in
     * 
     * @returns {boolean}
     */
    checkForWallCollision(desiredNewGridPosition, mazeArray, direction) {
        let roundingFunction = this.determineRoundingFunction(direction, this.directions);

        let desiredX = roundingFunction(desiredNewGridPosition.x);
        let desiredY = roundingFunction(desiredNewGridPosition.y);
        let newGridValue;

        if (Array.isArray(mazeArray[desiredY])) {
            newGridValue = mazeArray[desiredY][desiredX];
        }
        
        return (newGridValue === 'X');
    }

    snapToGrid(position, direction, scaledTileSize) {
        let newPosition = Object.assign({}, position);
        let roundingFunction = this.determineRoundingFunction(direction, this.directions);

        switch(direction) {
            case this.directions.up:
            case this.directions.down:
                newPosition.y = roundingFunction(newPosition.y);
                break;
            default:
                newPosition.x = roundingFunction(newPosition.x);
                break;
        }

        return {
            top: (newPosition.y - 0.5) * scaledTileSize,
            left: (newPosition.x - 0.5) * scaledTileSize
        };
    }

    checkForWarp(position, gridPosition, scaledTileSize) {
        let newPosition = Object.assign({}, position);

        if (gridPosition.x < -0.75) {
            newPosition.left = (scaledTileSize * 27.25);
        } else if (gridPosition.x > 27.75) {
            newPosition.left = (scaledTileSize * -1.25);
        }

        return newPosition;
    }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = CharacterUtil;
}