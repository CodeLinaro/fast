import { css, ElementViewTemplate, html, observable } from "@microsoft/fast-element";
import { FASTDataGridCell } from "../../../../index.js";
import type { ARTile } from "./ar-tile.js";

export function registerTileDispenser() {
    TileDispenser.define({
        name: "tile-dispenser",
        template: tileDispenserTemplate(),
        styles: tileDispenserStyles,
    });
}

/**
 *
 *
 * @public
 */
export class TileDispenser extends FASTDataGridCell {
    @observable
    public connectedTile: ARTile | undefined;

    public connectedCallback(): void {
        super.connectedCallback();
    }

    public disconnectedCallback(): void {
        super.disconnectedCallback();
    }
}

/**
 * The template
 * @public
 */
export function tileDispenserTemplate<T extends TileDispenser>(): ElementViewTemplate<T> {
    return html<T>`
        <template>
            <slot></slot>
        </template>
    `;
}

export const tileDispenserStyles = css`
    :host {
        box-sizing: border-box;
    }
`;
