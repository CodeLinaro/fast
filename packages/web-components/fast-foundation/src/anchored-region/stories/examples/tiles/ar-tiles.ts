import {
    bind,
    children,
    css,
    elements,
    ElementViewTemplate,
    FASTElement,
    html,
    observable,
    ref,
    repeat,
    RepeatDirective,
    Updates,
    ViewBehaviorOrchestrator,
    ViewTemplate,
    when,
} from "@microsoft/fast-element";
import { Orientation } from "@microsoft/fast-web-utilities";
import { ARTile, registerARTile, tileDragEventArgs } from "./ar-tile.js";
import { ARSocket, registerARSocket } from "./ar-socket.js";
import { registerScorePanel, ScorePanel, ScoreWord } from "./score-panel.js";
import type { BoardTile, GameConfig, GameState, TileData } from "./interfaces.js";

export function registerARTiles() {
    ARTiles.define({
        name: "ar-tiles",
        template: arTilesTemplate(),
        styles: arTilesStyles,
    });
    registerARTile();
    registerARSocket();
    registerScorePanel();
}

/**
 *
 *
 * @public
 */
export class ARTiles extends FASTElement {
    @observable
    public tileData: TileData[] = [];

    @observable
    public gameConfig: GameConfig = {
        columnCount: 11,
        rowCount: 11,
        tileData: [
            { title: "E", value: 1, column: 6, row: 6, fixed: true },
            { title: "E", value: 1 },
            { title: "A", value: 1 },
            { title: "R", value: 1 },
            { title: "I", value: 1 },
            { title: "O", value: 1 },
            { title: "T", value: 2 },
            { title: "N", value: 2 },
            { title: "S", value: 2 },
            { title: "L", value: 2 },
            { title: "C", value: 2 },
            { title: "U", value: 3 },
            { title: "D", value: 3 },
            { title: "P", value: 3 },
            { title: "M", value: 3 },
            { title: "H", value: 3 },
            { title: "G", value: 3 },
            { title: "B", value: 4 },
            { title: "F", value: 4 },
            { title: "Y", value: 4 },
            { title: "W", value: 4 },
            { title: "K", value: 4 },
            { title: "V", value: 4 },
            { title: "X", value: 5 },
            { title: "Z", value: 5 },
            { title: "J", value: 5 },
            { title: "Q", value: 5 },
            { title: "A", value: 1 },
            { title: "E", value: 1 },
            { title: "I", value: 1 },
            { title: "O", value: 1 },
            { title: "U", value: 3 },
            { title: "R", value: 1 },
            { title: "T", value: 2 },
        ],
    };
    public gameConfigChanged(): void {
        this.columnCount = this.gameConfig.columnCount || 14;
        this.rowCount = this.gameConfig.rowCount || 14;
        this.tileData.splice(0, this.tileData.length, ...this.gameConfig.tileData);
        this.tileData.forEach(tile => {
            if (!tile.row) {
                tile.row = undefined;
                tile.column = undefined;
            }
        });
        if (this.$fastController.isConnected) {
            this.reset();
        }
        // this.style.setProperty("--tile-size", "40px");
        this.style.setProperty("--column-count", `${this.columnCount}`);
        this.style.setProperty("--row-count", `${this.rowCount}`);
    }

    @observable
    public boardSpaces: BoardTile[] = [];

    @observable
    public score: number = 0;

    @observable
    public bestGame: GameState;

    public layout: HTMLDivElement;
    public board: HTMLDivElement;
    public hand: HTMLDivElement;
    public savedGameDisplay: HTMLDivElement;
    public scorePanel: ScorePanel;

    @observable
    public allTiles: ARTile[] = [];
    private allTilesChanged(): void {
        if (this.$fastController.isConnected && !this.tileUpdateQueued) {
            Updates.enqueue(() => {
                this.updateTiles();
            });
            this.tileUpdateQueued = true;
        }
    }

    @observable
    public enablePrevious: boolean = false;

    @observable
    public enableNext: boolean = false;

    @observable
    public enableLoad: boolean = false;

    @observable
    public showLoadMenu: boolean = false;

    @observable
    public showScoring: boolean = false;

    @observable
    public savedGames: GameState[] = [];

    @observable
    public currentBoardValid: boolean | undefined;

    private previousGameStates: GameState[] = [];
    private nextGameStates: GameState[] = [];

    private allSockets: ARSocket[] = [];
    private activeSockets: ARSocket[] = [];
    private placedTiles: ARTile[] = [];
    private fixedTileData: TileData[] = [];
    private handTileData: TileData[] = [];

    private activeBoardTiles: HTMLElement[] = [];

    private currentDragTile: ARTile | undefined;

    private hoverSocket: ARSocket | undefined;
    private behaviorOrchestrator: ViewBehaviorOrchestrator | null = null;

    private dispenserPlaceholder: Node | null = null;
    private tilePlaceholder: Node | null = null;

    private boardTilePlaceholder: Node | null = null;

    private rowCount: number;
    private columnCount: number;

    private tileUpdateQueued: boolean = false;
    private currentStateValidated: boolean = false;

    private validWords: string[] = [];
    private pendingVerification: string[] = [];
    private invalidWords: string[] = [];

    public connectedCallback(): void {
        super.connectedCallback();
        this.addEventListener("socketconnected", this.handleSocketConnected);
        this.addEventListener("socketdisconnected", this.handleSocketDisconnected);
        this.addEventListener("dragtilestart", this.handleDragTileStart);
        this.addEventListener("dragtileend", this.handleDragTileEnd);
        this.addEventListener("loadbestgame", this.loadBestGame);

        this.dispenserPlaceholder = document.createComment("");
        this.tilePlaceholder = document.createComment("");
        this.boardTilePlaceholder = document.createComment("");

        if (this.behaviorOrchestrator === null) {
            this.behaviorOrchestrator = ViewBehaviorOrchestrator.create(this);
            this.$fastController.addBehavior(this.behaviorOrchestrator);

            this.behaviorOrchestrator.addBehaviorFactory(
                new RepeatDirective<ARTiles>(
                    bind(x => x.handTileData, false),
                    bind(x => dispenserTemplate, false),
                    {}
                ),
                this.hand.appendChild(this.dispenserPlaceholder)
            );

            this.behaviorOrchestrator.addBehaviorFactory(
                new RepeatDirective<ARTiles>(
                    bind(x => x.handTileData, false),
                    bind(x => letterTileTemplate, false),
                    {}
                ),
                this.layout.appendChild(this.tilePlaceholder)
            );

            this.behaviorOrchestrator.addBehaviorFactory(
                new RepeatDirective<ARTiles>(
                    bind(x => x.fixedTileData, false),
                    bind(x => letterTileTemplate, false),
                    {}
                ),
                this.layout.appendChild(this.tilePlaceholder)
            );

            this.behaviorOrchestrator.addBehaviorFactory(
                new RepeatDirective<ARTiles>(
                    bind(x => x.boardSpaces, false),
                    bind(x => boardTileTemplate, false),
                    { positioning: true }
                ),
                this.board.appendChild(this.boardTilePlaceholder)
            );

            this.reset();
        }
    }

    public disconnectedCallback(): void {
        super.disconnectedCallback();
        this.removeEventListener("socketconnected", this.handleSocketConnected);
        this.removeEventListener("socketdisconnected", this.handleSocketDisconnected);
        this.removeEventListener("dragtilestart", this.handleDragTileStart);
        this.removeEventListener("dragtileend", this.handleDragTileEnd);
        this.allSockets.splice(0, this.allSockets.length);
        this.activeSockets.splice(0, this.activeSockets.length);
        this.placedTiles.splice(0, this.placedTiles.length);
        this.currentDragTile = undefined;
        this.hoverSocket = undefined;
    }

    public handleDragTileStart = (e: CustomEvent): void => {
        if (e.defaultPrevented) {
            return;
        }
        e.preventDefault();
        this.saveCurrentGameStateToBackStack();
        const detail = e.detail as tileDragEventArgs;
        this.currentDragTile = detail.tile;

        if (this.currentDragTile === undefined) {
            return;
        }
        if (this.placedTiles.includes(this.currentDragTile)) {
            this.removeTileFromSocket(this.currentDragTile);
        }
        this.addEventListener("sockethovered", this.handleSocketHovered);
        this.addEventListener("socketunhovered", this.handleSocketUnhovered);
        this.currentDragTile.addEventListener("dragtile", this.handleTileDrag);
        this.currentDragTile.useVirtualAnchor = true;
        this.currentDragTile.horizontalDefaultPosition = "right";
        this.currentDragTile.verticalDefaultPosition = "bottom";
        this.placedTiles.forEach(tile => {
            tile.update();
            tile.sockets.forEach(socket => {
                socket.virtualAnchorX =
                    detail.event.pageX - document.documentElement.scrollLeft;
                socket.virtualAnchorY =
                    detail.event.pageY - document.documentElement.scrollTop;
            });
        });
        this.currentDragTile.addEventListener(
            "positionchange",
            this.handleDragTilePositionChange
        );
        const originalSocket = this.shadowRoot?.getElementById(
            `dispenser-${this.currentDragTile.tileData.tileId}`
        );
        if (originalSocket) {
            this.currentDragTile.anchorElement = originalSocket;
        }
    };

    public handleDragTilePositionChange = (): void => {
        this.currentDragTile?.removeEventListener(
            "positionchange",
            this.handleDragTilePositionChange
        );
        Updates.enqueue(() => {
            const activeBoardTileIds: string[] = [];
            this.allSockets.forEach(socket => {
                if (this.isValidSocket(socket)) {
                    socket.socketActive = true;
                    this.activeSockets.push(socket);
                    if (socket.parentTile) {
                        const boardTile: BoardTile = this.getBoardTileForSocket(socket);
                        const boardTileId: string = `board-tile-${boardTile.row}-${boardTile.column}`;
                        if (!activeBoardTileIds.includes(boardTileId)) {
                            activeBoardTileIds.push(boardTileId);
                        }
                    }
                }
            });
            activeBoardTileIds.forEach(boardTileId => {
                const boardTile:
                    | HTMLElement
                    | null
                    | undefined = this.shadowRoot?.getElementById(boardTileId);
                if (boardTile) {
                    boardTile.classList.toggle("active", true);
                    this.activeBoardTiles.push(boardTile);
                }
            });
        });
    };

    public handleDragTileEnd = (e: CustomEvent): void => {
        if (e.defaultPrevented || !this.currentDragTile) {
            return;
        }
        e.preventDefault();
        if (this.hoverSocket) {
            this.nextGameStates.splice(0, this.nextGameStates.length);
            this.enableNext = false;
            this.setTileInSocket(this.hoverSocket, this.currentDragTile);
            this.enablePrevious = true;
            this.enableNext = false;
            this.nextGameStates.splice(0, this.nextGameStates.length);
        } else {
            this.currentDragTile.tileData.column = undefined;
            this.currentDragTile.tileData.row = undefined;
            const originalSocket = this.shadowRoot?.getElementById(
                `dispenser-${this.currentDragTile.tileData.tileId}`
            );
            if (originalSocket) {
                this.setTileInSocket(originalSocket as ARSocket, this.currentDragTile);
            }
        }

        this.removeEventListener("sockethovered", this.handleSocketHovered);
        this.removeEventListener("socketunhovered", this.handleSocketUnhovered);
        this.updateActiveSockets(e.detail as tileDragEventArgs);
        this.activeSockets.forEach(socket => {
            socket.anchorElement = null;
            socket.socketActive = false;
        });
        this.activeSockets.splice(0, this.activeSockets.length);
        this.currentDragTile.removeEventListener("dragtile", this.handleTileDrag);
        this.currentDragTile = undefined;
        this.hoverSocket = undefined;

        this.activeBoardTiles.forEach(boardTile => {
            boardTile.classList.toggle("active", false);
        });
    };

    private saveCurrentGameStateToBackStack(): void {
        const currentGameState = this.getCurrentGameState();
        if (
            this.previousGameStates.length > 0 &&
            JSON.stringify(
                this.previousGameStates[this.previousGameStates.length - 1]
            ) === JSON.stringify(currentGameState)
        ) {
            return;
        }
        this.previousGameStates.push(currentGameState);
    }

    private getCurrentGameState(): GameState {
        const currentTileData: TileData[] = [];
        this.tileData.forEach(tileData => {
            currentTileData.push(
                Object.assign({ row: undefined, column: undefined }, tileData)
            );
        });
        const date: Date = new Date();
        const gameState: GameState = {
            timeStamp: date.toLocaleString(),
            score: this.score,
            tileData: currentTileData,
            validated: this.currentStateValidated,
        };
        return gameState;
    }

    private isSocketOutsideGameGrid(socket: ARSocket): boolean {
        if (
            !socket.parentTile ||
            !this.placedTiles.includes(socket.parentTile) ||
            !socket.parentTile.tileData.row ||
            !socket.parentTile.tileData.column
        ) {
            return false;
        }

        const boardTile: BoardTile = this.getBoardTileForSocket(socket);
        if (
            boardTile.column < 1 ||
            boardTile.column > this.columnCount ||
            boardTile.row < 1 ||
            boardTile.row > this.rowCount
        ) {
            return false;
        }

        return true;
    }

    private isValidSocket(socket: ARSocket): boolean {
        if (
            (this.currentDragTile && this.currentDragTile.sockets.includes(socket)) ||
            !this.isSocketOutsideGameGrid(socket) ||
            this.hand.contains(socket) ||
            socket.connectedTile !== undefined
        ) {
            return false;
        }

        const dropRect: DOMRect | undefined = this.getDropRect(
            socket,
            this.currentDragTile?.regionRect
        );
        if (!dropRect) {
            return false;
        }

        let intersecting: boolean = false;

        for (let i = 0; i < this.placedTiles.length; i++) {
            const tile: ARTile = this.placedTiles[i];
            if (tile.regionRect && this.isIntersecting(tile.regionRect, dropRect)) {
                intersecting = true;
                break;
            }
        }

        if (socket.parentTile && !intersecting) {
            return true;
        }

        return false;
    }

    private isIntersecting(rectA: DOMRect, rectB: DOMRect): boolean {
        if (
            rectA.left >= rectB.right ||
            rectA.top >= rectB.bottom ||
            rectA.right <= rectB.left ||
            rectA.bottom <= rectB.top
        ) {
            return false;
        }
        return true;
    }

    private isOutside(viewportRect: DOMRect, elementRect: DOMRect): boolean {
        // todo: rig up horizontal?
        if (
            elementRect.top - 40 > viewportRect.top &&
            elementRect.bottom + 40 < viewportRect.bottom
        ) {
            return false;
        }
        return true;
    }

    private getDropRect(
        socket: ARSocket,
        tileRect: DOMRect | undefined
    ): DOMRect | undefined {
        if (!socket.regionRect || !tileRect) {
            return undefined;
        }

        return socket.regionRect;
    }

    public handleTileDrag = (e: CustomEvent): void => {
        if (e.defaultPrevented || !this.currentDragTile) {
            return;
        }
        e.preventDefault();
        this.updateActiveSockets(e.detail as tileDragEventArgs);

        if (
            this.currentDragTile.viewportRect &&
            this.currentDragTile.regionRect &&
            this.isOutside(
                this.currentDragTile.viewportRect,
                this.currentDragTile.regionRect
            )
        ) {
            this.currentDragTile.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
            });
        }
    };

    private updateActiveSockets(detail: tileDragEventArgs): void {
        this.activeSockets.forEach(socket => {
            socket.virtualAnchorX =
                detail.event.pageX - document.documentElement.scrollLeft;
            socket.virtualAnchorY =
                detail.event.pageY - document.documentElement.scrollTop;
        });
    }

    public handleSocketConnected = (e: CustomEvent): void => {
        if (e.defaultPrevented) {
            return;
        }
        e.preventDefault();
        this.allSockets.push(e.detail as ARSocket);
    };

    public handleSocketDisconnected = (e: CustomEvent): void => {
        if (e.defaultPrevented || !e.target) {
            return;
        }
        e.preventDefault();
        const socket: ARSocket = e.detail as ARSocket;
        if (this.allSockets.includes(socket)) {
            this.allSockets.splice(this.allSockets.indexOf(socket), 1);
        }
        if (this.activeSockets.includes(socket)) {
            this.activeSockets.splice(this.activeSockets.indexOf(socket as ARSocket), 1);
        }
    };

    public handleSocketHovered = (e: CustomEvent): void => {
        if (e.defaultPrevented || !e.target || !this.currentDragTile) {
            return;
        }
        e.preventDefault();
        this.hoverSocket = e.detail as ARSocket;

        this.setTileInSocket(this.hoverSocket, this.currentDragTile);
    };

    public handlePreviousClick = (e: MouseEvent): void => {
        if (this.previousGameStates.length === 0) {
            return;
        }
        const gameState: GameState | undefined = this.previousGameStates.pop();
        if (gameState) {
            this.nextGameStates.push(this.getCurrentGameState());
            this.applyGameState(gameState);
            this.enableNext = true;
            if (this.previousGameStates.length === 0) {
                this.enablePrevious = false;
            }
        }
        return;
    };

    public handleNextClick = (e: MouseEvent): void => {
        if (this.nextGameStates.length === 0) {
            return;
        }
        const gameState: GameState | undefined = this.nextGameStates.pop();
        if (gameState) {
            this.saveCurrentGameStateToBackStack();
            this.applyGameState(gameState);
            if (this.nextGameStates.length === 0) {
                this.enableNext = false;
            }
            this.enablePrevious = true;
        }
        return;
    };

    private applyGameState(gameState: GameState): void {
        for (let i = 0; i < gameState.tileData.length; i++) {
            Object.assign(this.tileData[i], gameState.tileData[i]);
        }
        this.updateTiles();
    }

    public handleSocketUnhovered = (e: CustomEvent): void => {
        if (
            e.defaultPrevented ||
            !e.target ||
            !this.hoverSocket ||
            !this.currentDragTile
        ) {
            return;
        }
        e.preventDefault();
        this.currentDragTile.useVirtualAnchor = true;
        this.currentDragTile.horizontalDefaultPosition = "right";
        this.currentDragTile.verticalDefaultPosition = "bottom";
        this.removeTileFromSocket(this.currentDragTile);
        this.hoverSocket = undefined;
    };

    private setTileInSocket(socket: ARSocket, tile: ARTile): void {
        let anchorElement: HTMLElement | null = null;

        if (socket.parentTile) {
            const dropRect: DOMRect | undefined = this.getDropRect(
                socket,
                tile.regionRect
            );

            if (dropRect) {
                this.activeSockets.forEach(activeSocket => {
                    const activeDropRect = this.getDropRect(
                        activeSocket,
                        tile.regionRect
                    );
                    if (activeDropRect && this.isIntersecting(dropRect, activeDropRect)) {
                        this.connectTileToSocket(activeSocket, tile);
                    }
                });
            }

            const boardTile: BoardTile = this.getBoardTileForSocket(socket);

            tile.tileData.row = boardTile.row;
            tile.tileData.column = boardTile.column;

            if (this.shadowRoot) {
                anchorElement = this.shadowRoot.getElementById(
                    `board-tile-${boardTile.row}-${boardTile.column}`
                );
            }
        }

        tile.anchorElement = anchorElement || socket;
        tile.useVirtualAnchor = false;
        tile.horizontalDefaultPosition = "center";
        tile.verticalDefaultPosition = "center";

        if (!this.placedTiles.includes(tile) && !this.hand.contains(socket)) {
            this.placedTiles.push(tile);
        }
        this.updateScore();
        Updates.enqueue(() => tile.update());
    }

    private getBoardTileForSocket(socket: ARSocket): BoardTile {
        let row: number = socket.parentTile?.tileData.row || 0;
        let column: number = socket.parentTile?.tileData.column || 0;

        switch (socket.socketFacing) {
            case "left":
                column = column - 1;
                break;
            case "right":
                column = column + 1;
                break;
            case "top":
                row = row - 1;
                break;
            case "bottom":
                row = row + 1;
                break;
        }

        return { row, column };
    }

    private removeTileFromSocket(tile: ARTile): void {
        const originalSocket = this.shadowRoot?.getElementById(
            `dispenser-${tile.tileData.tileId}`
        );
        if (originalSocket) {
            tile.anchorElement = originalSocket;
        }

        tile.tileData.column = undefined;
        tile.tileData.row = undefined;

        tile.sockets.forEach(dragTileSocket => {
            if (dragTileSocket.connectedTile) {
                dragTileSocket.connectedTile.sockets.forEach(childTileSocket => {
                    if (childTileSocket.connectedTile === tile) {
                        childTileSocket.connectedTile = undefined;
                    }
                });
                const tileToCheck: ARTile = dragTileSocket.connectedTile;
                dragTileSocket.connectedTile = undefined;
                if (
                    !tileToCheck.tileData.fixed &&
                    !this.isConnectedToFixedTile(tileToCheck, [])
                ) {
                    this.removeTileFromSocket(tileToCheck);
                }
            }
        });
        if (this.placedTiles.includes(tile)) {
            this.placedTiles.splice(this.placedTiles.indexOf(tile), 1);
        }

        this.updateScore();
    }

    private isConnectedToFixedTile(tile: ARTile, checkedTiles: ARTile[]): boolean {
        if (checkedTiles.includes(tile)) {
            return false;
        }
        checkedTiles.push(tile);
        for (let i = 0; i < tile.sockets.length; i++) {
            const connectedTile = tile.sockets[i].connectedTile;
            if (
                connectedTile &&
                (connectedTile.tileData.fixed ||
                    this.isConnectedToFixedTile(connectedTile, checkedTiles))
            ) {
                return true;
            }
        }

        return false;
    }

    private updateScore(): void {
        let newScore: number = 0;
        this.scorePanel.horizontalWords?.splice(
            0,
            this.scorePanel.horizontalWords.length
        );
        this.scorePanel.verticalWords?.splice(0, this.scorePanel.verticalWords.length);

        let wordTiles: ARTile[];
        let wordString: string;
        let currentTile: ARTile;
        let wordValue: number;
        let isWordValid: boolean | undefined = true;
        let isBoardValid: boolean | undefined = true;

        this.placedTiles.forEach(tile => {
            if (!tile.socketLeft.connectedTile && tile.socketRight.connectedTile) {
                wordTiles = [tile];
                wordString = tile.tileData.title;
                currentTile = tile;
                wordValue = tile.tileData.value;
                while (currentTile.socketRight.connectedTile) {
                    wordTiles.push(currentTile.socketRight.connectedTile);
                    currentTile = currentTile.socketRight.connectedTile;
                    wordString = `${wordString}${currentTile.tileData.title}`;
                    wordValue = wordValue + currentTile.tileData.value;
                }
                isWordValid = this.validWords.includes(wordString)
                    ? true
                    : this.invalidWords.includes(wordString)
                    ? false
                    : undefined;
                if (isBoardValid) {
                    isBoardValid = isWordValid;
                }
                wordValue = wordValue * wordTiles.length;
                const scoreWord: ScoreWord = {
                    word: wordString,
                    tiles: wordTiles,
                    value: wordValue,
                    orientation: Orientation.horizontal,
                    isValid: isWordValid,
                };
                this.scorePanel.horizontalWords?.push(scoreWord);
                newScore = newScore + wordValue;
            }

            if (!tile.socketTop.connectedTile && tile.socketBottom.connectedTile) {
                wordTiles = [tile];
                wordString = tile.tileData.title;
                currentTile = tile;
                wordValue = tile.tileData.value;
                while (currentTile.socketBottom.connectedTile) {
                    wordTiles.push(currentTile.socketBottom.connectedTile);
                    currentTile = currentTile.socketBottom.connectedTile;
                    wordString = `${wordString}${currentTile.tileData.title}`;
                    wordValue = wordValue + currentTile.tileData.value;
                }
                isWordValid = this.validWords.includes(wordString)
                    ? true
                    : this.invalidWords.includes(wordString)
                    ? false
                    : undefined;
                if (isBoardValid) {
                    isBoardValid = isWordValid;
                }
                wordValue = wordValue * wordTiles.length;
                const scoreWord: ScoreWord = {
                    word: wordString,
                    tiles: wordTiles,
                    value: wordValue,
                    orientation: Orientation.vertical,
                    isValid: isWordValid,
                };
                this.scorePanel.verticalWords?.push(scoreWord);
                newScore = newScore + wordValue;
            }
        });
        this.score = newScore;

        if (
            !this.scorePanel.verticalWords.length &&
            !this.scorePanel.horizontalWords.length
        ) {
            this.currentBoardValid = undefined;
        } else {
            this.currentBoardValid = isBoardValid;
        }

        if (
            isBoardValid &&
            (this.scorePanel.verticalWords.length ||
                this.scorePanel.horizontalWords.length)
        ) {
            if (!this.scorePanel.bestGame) {
                this.scorePanel.bestGame = this.getCurrentGameState();
            } else if (this.score > this.scorePanel.bestGame.score) {
                this.scorePanel.bestGame = this.getCurrentGameState();
            }
        }
    }

    private reset(): void {
        this.score = 0;
        this.allSockets.splice(0, this.allSockets.length);
        this.activeSockets.splice(0, this.activeSockets.length);
        this.placedTiles.splice(0, this.placedTiles.length);
        this.fixedTileData.splice(0, this.fixedTileData.length);
        this.handTileData.splice(0, this.handTileData.length);
        this.boardSpaces.splice(0, this.boardSpaces.length);
        this.currentDragTile = undefined;
        this.hoverSocket = undefined;

        for (let row = 1; row <= this.rowCount; row++) {
            for (let column = 1; column <= this.columnCount; column++) {
                this.boardSpaces.push({
                    row,
                    column,
                });
            }
        }

        this.tileData.forEach(thisTileData => {
            thisTileData.tileId = `tile-${this.tileData.indexOf(thisTileData)}`;
            if (thisTileData.fixed) {
                this.fixedTileData.push(thisTileData);
            } else {
                this.handTileData.push(thisTileData);
            }
        });
    }

    private updateTiles(): void {
        this.tileUpdateQueued = false;
        this.placedTiles.splice(0, this.placedTiles.length);
        let anchorElement: Element | null | undefined = null;
        this.allTiles.forEach(tile => {
            if (tile.tileData.row && tile.tileData.column) {
                anchorElement = this.shadowRoot?.getElementById(
                    `board-tile-${tile.tileData.row}-${tile.tileData.column}`
                );
                this.placedTiles.push(tile);
            } else {
                anchorElement = this.shadowRoot?.getElementById(
                    `dispenser-${tile.tileData.tileId}`
                );
            }
            if (anchorElement !== undefined && anchorElement !== tile.anchorElement) {
                tile.anchorElement = anchorElement;
            }
            tile.sockets.forEach(socket => {
                socket.connectedTile = undefined;
            });
            anchorElement = null;
        });

        this.placedTiles.forEach(tile => {
            for (let i = 0; i < this.placedTiles.length; i++) {
                const compareTile = this.placedTiles[i];
                if (
                    compareTile !== tile &&
                    compareTile.tileData.row &&
                    compareTile.tileData.column
                ) {
                    if (
                        tile.tileData.row === compareTile.tileData.row &&
                        tile.tileData.column === compareTile.tileData.column - 1
                    ) {
                        this.connectTileToSocket(tile.socketRight, compareTile);
                    } else if (
                        tile.tileData.column === compareTile.tileData.column &&
                        tile.tileData.row === compareTile.tileData.row - 1
                    ) {
                        this.connectTileToSocket(tile.socketBottom, compareTile);
                    }
                }
            }
        });

        this.updateScore();
    }

    private connectTileToSocket(socket: ARSocket, tile: ARTile): void {
        socket.connectedTile = tile;
        switch (socket.socketFacing) {
            case "left":
                tile.socketRight.connectedTile = socket.parentTile;
                break;
            case "right":
                tile.socketLeft.connectedTile = socket.parentTile;
                break;
            case "top":
                tile.socketBottom.connectedTile = socket.parentTile;
                break;
            case "bottom":
                tile.socketTop.connectedTile = socket.parentTile;
                break;
        }
    }

    public handleSaveGameClick = (e: MouseEvent): void => {
        this.savedGames.push(this.getCurrentGameState());
        this.enableLoad = true;
    };

    public handleLoadGameClick = (e: MouseEvent): void => {
        this.showLoadMenu = !this.showLoadMenu;
    };

    public handleLoadSaveGameClick = (e: MouseEvent, gameState: GameState): void => {
        this.saveCurrentGameStateToBackStack();
        this.applyGameState(gameState);
        this.showLoadMenu = false;
    };

    public handleShowScoringClick = (e: MouseEvent): void => {
        this.showScoring = !this.showScoring;
    };

    public handleValidateClick = (e: MouseEvent): void => {
        this.validateWords(this.scorePanel.horizontalWords);
        this.validateWords(this.scorePanel.verticalWords);
    };

    public loadBestGame = (): void => {
        if (this.scorePanel.bestGame) {
            this.saveCurrentGameStateToBackStack();
            this.applyGameState(this.scorePanel.bestGame);
        }
    };

    private validateWords(words: ScoreWord[]): void {
        words.forEach(scoreWord => {
            if (
                !this.validWords.includes(scoreWord.word) &&
                !this.invalidWords.includes(scoreWord.word) &&
                !this.pendingVerification.includes(scoreWord.word)
            ) {
                this.pendingVerification.push(scoreWord.word);
                this.validateWord(scoreWord.word);
            }
        });
    }

    private async validateWord(word: string): Promise<void> {
        try {
            const response: Response = await fetch(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
            );
            const data: Object = await response.json();
            if (this.pendingVerification.includes(word)) {
                this.pendingVerification.splice(
                    this.pendingVerification.indexOf(word),
                    1
                );
            }
            if (Array.isArray(data)) {
                if (!this.validWords.includes(word)) {
                    this.validWords.push(word);
                }
            } else {
                if (!this.invalidWords.includes(word)) {
                    this.invalidWords.push(word);
                }
            }
        } catch (err) {
            if (this.pendingVerification.includes(word)) {
                this.pendingVerification.splice(
                    this.pendingVerification.indexOf(word),
                    1
                );
            }
        }
        this.updateScore();
    }
}

const boardTileTemplate: ViewTemplate<BoardTile> = html`
    <div
        id="board-tile-${x => x.row}-${x => x.column}"
        class="board-tile"
        style="grid-column:${x => x.column}; grid-row:${x => x.row}"
    ></div>
`;

const savedGameTemplate: ViewTemplate<GameState> = html`
    <fast-option
        class="saved-game-option"
        @click="${(x, c) => c.parent.handleLoadSaveGameClick(c.event as MouseEvent, x)}"
    >
        <div class="saved-game-display">
            <div class="saved-game-timestamp">
                ${x => x.timeStamp}
            </div>
            <div class="saved-game-score">
                ${x => x.score}
            </div>
        </div>
    </fast-option>
`;

const letterTileTemplate: ViewTemplate<TileData> = html`
    <ar-tile
        :tileData="${x => x}"
        id="${x => x.tileId}"
        viewport="layout"
        vertical-viewport-lock="true"
        horizontal-viewport-lock="true"
    ></ar-tile>
`;

const dispenserTemplate: ViewTemplate<TileData> = html`
    <ar-socket
        id="dispenser-${x => x.tileId}"
        socket-facing="center"
        class="dispenser"
    ></ar-socket>
`;

/**
 * The template
 * @public
 */
export function arTilesTemplate<T extends ARTiles>(): ElementViewTemplate<T> {
    return html<T>`
        <template>
            <fast-toolbar orientation="horizontal" class="toolbar" toolbar-item-gap="0">
                <fast-button
                    class="previous-button"
                    disabled="${x => (x.enablePrevious ? void 0 : "true")}"
                    @click="${(x, c) => x.handlePreviousClick(c.event as MouseEvent)}"
                >
                    ◄
                </fast-button>
                <fast-button
                    class="next-button"
                    disabled="${x => (x.enableNext ? void 0 : "true")}"
                    @click="${(x, c) => x.handleNextClick(c.event as MouseEvent)}"
                >
                    ►
                </fast-button>

                <fast-button
                    class="save-button"
                    @click="${(x, c) => x.handleSaveGameClick(c.event as MouseEvent)}"
                >
                    Save
                </fast-button>

                <fast-button
                    id="load-button"
                    class="load-button"
                    disabled="${x => (x.enableLoad ? void 0 : "true")}"
                    @click="${(x, c) => x.handleLoadGameClick(c.event as MouseEvent)}"
                >
                    Load
                </fast-button>

                <fast-button
                    id="validate-button"
                    class="validate-button"
                    @click="${(x, c) => x.handleValidateClick(c.event as MouseEvent)}"
                >
                    Validate
                </fast-button>

                <fast-button
                    class="
                        scoring-button
                        ${x =>
                        x.currentBoardValid === true
                            ? "valid"
                            : x.currentBoardValid === false
                            ? "invalid"
                            : void 0}
                    "
                    @click="${(x, c) => x.handleShowScoringClick(c.event as MouseEvent)}"
                >
                    Score: ${x => x.score}
                </fast-button>
            </fast-toolbar>
            ${when(
                x => x.showLoadMenu,
                html`
                    <fast-anchored-region
                        class="show-menu-region"
                        anchor="load-button"
                        auto-update-mode="auto"
                        horizontal-inset="true"
                        horizontal-viewport-lock="true"
                        horizontal-positioning-mode="dynamic"
                        horizontal-scaling="content"
                        vertical-default-position="bottom"
                        vertical-positioning-mode="locktodefault"
                        vertical-scaling="fill"
                    >
                        <fast-menu class="load-menu">
                            ${repeat(x => x.savedGames, savedGameTemplate)}
                        </fast-menu>
                    </fast-anchored-region>
                `
            )}
            <div
                id="layout"
                class="layout"
                ${children({
                    property: "allTiles",
                    filter: elements("ar-tile"),
                })}
                ${ref("layout")}
            >
                <div id="board" class="board" ${ref("board")}></div>
                <div class="hand-panel">
                    <div id="hand" class="hand" ${ref("hand")}></div>
                </div>
            </div>
            <score-panel class="scoring" ${ref("scorePanel")}></score-panel>
        </template>
    `;
}

export const arTilesStyles = css`
    :host {
        --tile-size: 40px;
        --column-count: 12;
        --row-count: 12;
        height: auto;
        width: 100%;
        display: grid;
        grid-template-columns: 10px auto 10px 1fr 10px;
        grid-template-rows: 10px auto 1fr 10px;
    }

    .toolbar {
        grid-row: 2;
        grid-column: 2 / 5;
        --toolbar-item-gap: 2;
    }

    .toolbar::part(positioning-region) {
        width: 100%;
        justify-content: flex-start;
        align-items: flex-start;
        flex-wrap: nowrap;
    }

    .previous-button,
    .next-button,
    .save-button,
    .load-button,
    .validate-button,
    .scoring-button {
        height: 30px;
    }

    .scoring-button {
        flex: 0 1 100%;
    }

    .valid {
        background: green;
    }

    .invalid {
        background: red;
    }

    .layout {
        height: auto;
        width: auto;
        position: relative;
        display: grid;
        grid-row: 3;
        grid-column: 2;
        grid-template-columns: 1fr;
        grid-template-rows: auto 10px 1fr;
    }

    .board {
        width: auto;
        grid-row: 1;
        grid-column: 2;
        background: lightgray;
        display: grid;
        grid-template-columns: repeat(var(--column-count), var(--tile-size));
        grid-template-rows: repeat(var(--row-count), var(--tile-size));
    }

    .hand-panel {
        contain: inline-size;
        display: block;
        width: 100%;
        height: auto;
        grid-row: 3;
        grid-column: 2;
        background: lightgray;
    }

    .hand {
        flex-wrap: wrap;
        display: flex;
        width: 100%;
        height: auto;
    }

    .dispenser {
        display: inline-block;
        height: var(--tile-size);
        width: var(--tile-size);
    }

    .scoring {
        contain: size;
        height: auto;
        padding: 10px;
        overflow-y: auto;
        overflow-x: hidden;
        background: darkgray;
        grid-row: 3;
        grid-column: 4;
    }

    .board-tile {
        border: solid 2px;
    }

    .board-tile.active {
        background: white;
    }

    .saved-game-listbox {
        width: 100%;
        min-height: 50px;
    }

    .saved-game-display {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: 1fr;
    }

    .saved-game-option {
        width: 100%;
    }

    .saved-game-option::part(content) {
        width: 100%;
    }

    .saved-game-timestamp {
        grid-column: 1;
        grid-row: 1;
    }

    .saved-game-score {
        background: green;
        grid-column: 2;
        grid-row: 1;
    }

    .show-menu-region {
        display: flex;
        flex-direction: column;
        z-index: 100;
        overflow: hidden;
    }

    .load-menu {
        width: 100%;
        overflow-y: auto;
        overflow-x: hidden;
    }
`;
