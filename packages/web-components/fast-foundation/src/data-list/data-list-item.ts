import { FASTElement, HTMLView, observable, ViewTemplate } from "@microsoft/fast-element";
import { Orientation } from "@microsoft/fast-web-utilities";

/**
 *  The DataListItem class.  Note that all props are set at runtime by the parent list.
 *
 * @public
 */
export class FASTDataListItem extends FASTElement {
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
     * The orientation of the parent list
     *
     * @internal
     */
    @observable
    public orientation: Orientation = Orientation.vertical;

    /**
     * The viewtemplate used to render the item contents
     *
     * @internal
     */
    @observable
    public itemContentsTemplate: ViewTemplate;
    private itemContentsTemplateChanged(): void {
        if (this.$fastController.isConnected) {
            if (this.customView) {
                this.customView.dispose();
            }
            this.customView = this.itemContentsTemplate.render(this, this);
        }
    }

    private customView: HTMLView | null = null;

    /**
     * @internal
     */
    connectedCallback() {
        super.connectedCallback();
        if (this.itemContentsTemplate) {
            this.customView = this.itemContentsTemplate.render(this, this);
        }

        this.$emit("listitemconnected");
    }

    /**
     * @internal
     */
    disconnectedCallback(): void {
        super.disconnectedCallback();
        if (this.customView) {
            this.customView.dispose();
            this.customView = null;
        }
        this.$emit("listitemdisconnected");
    }
}
