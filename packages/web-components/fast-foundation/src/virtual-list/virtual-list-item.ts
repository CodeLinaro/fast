import { observable } from "@microsoft/fast-element";
import { FASTDataListItem } from "../data-list/data-list-item.js";
import type { SizeMap } from "./virtual-list.options.js";

/**
 *  The VirtualListItem class.  Note that all props are set at runtime by the parent list.
 *
 * @public
 */
export class FASTVirtualListItem extends FASTDataListItem {
    /**
     * The list sizemap
     *
     * @internal
     */
    @observable
    public sizeMap: SizeMap[];
    private sizeMapChanged(): void {
        this.itemSizeMap = this.sizeMap[this.itemIndex];
    }

    /**
     * The item sizemap
     *
     * @internal
     */
    @observable
    public itemSizeMap: SizeMap;

    /**
     * The data associated with this item
     *
     * @internal
     */
    @observable
    public itemData: object;

    /**
     * The index of the item in the items array.
     *
     * @internal
     */
    @observable
    public itemIndex: number;

    /**
     * The start position of the item on the virtualized axis
     *
     * @internal
     */
    @observable
    public startPosition: number = 0;

    /**
     * @internal
     */
    connectedCallback() {
        super.connectedCallback();
    }

    /**
     * @internal
     */
    disconnectedCallback(): void {
        super.disconnectedCallback();
    }
}
