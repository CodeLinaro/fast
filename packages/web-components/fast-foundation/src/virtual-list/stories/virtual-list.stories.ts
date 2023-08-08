import { html, when } from "@microsoft/fast-element";
import type { Meta, Story, StoryArgs } from "../../__test__/helpers.js";
import { renderComponent } from "../../__test__/helpers.js";
import type { FASTVirtualList } from "../virtual-list.js";

// create a sample data set
function newDataSet(rowCount: number, prefix: number): object[] {
    const newData: object[] = [];
    for (let i = 1; i <= rowCount; i++) {
        newData.push({
            value: `${i}`,
            title: `item #${i}`,
            url: `https://picsum.photos/200/200?random=${prefix * 1000 + i}`,
            itemSize: 100 + Math.floor(Math.random() * 300),
            itemCollapsedSize: 100,
        });
    }
    return newData;
}

const itemContentsTemplate = html`
    <fast-card>
        <div
            style="
                margin: 5px 20px 0 20px;
                color: white;
            "
        >
            ${x => x.itemData.title}
        </div>
        ${when(
            x => x.loadContent,
            html`
                <div
                    style="
                        height: 160px;
                        width:160px;
                        margin:10px 20px 10px 20px;
                        background-image: url('${x => x.itemData.url}');
                "
                ></div>
            `
        )}
        ${when(
            x => !x.loadContent,
            html`
                <div
                    style="
                    background: white;
                    opacity: 0.2;
                    height: 160px;
                    width:160px;
                    margin:10px 20px 10px 20px;
            "
                ></div>
            `
        )}
    </fast-card>
`;

const storyTemplate = html<StoryArgs<FASTVirtualList>>`
    <fast-virtual-list
        :sourceItems="${newDataSet(5000, 1)}"
        :sizemap="${x => x.sizemap}"
        virtualization-disabled="${x => x.virtualizationDisabled}"
        viewport="${x => x.viewport}"
        item-size="${x => x.itemSize}"
        viewport-buffer="${x => x.viewportBuffer}"
        orientation="${x => x.orientation}"
        auto-update-mode="${x => x.autoUpdateMode}"
        recycle="${x => x.recycle}"
        auto-resize-items="${x => x.autoResizeItems}"
        idle-load-mode="${x => x.idleLoadMode}"
        idle-callback-timeout="${x => x.idleCallbackTimeout}"
        list-item-load-mode="${x => x.listItemLoadMode}"
        :itemContentsTemplate="${itemContentsTemplate}"
    ></fast-virtual-list>
`;

export default {
    title: "Virtual List",
    args: {
        itemSize: 207,
        itemLoadMode: "idle",
    },
    argTypes: {
        virtualizationDisabled: {
            control: { type: "boolean" },
        },
        viewport: {
            control: { type: "text" },
        },
        itemSize: {
            control: { type: "number" },
        },
        viewportBuffer: {
            control: { type: "number" },
        },
        orientation: {
            options: ["horizontal", "vertical"],
            control: { type: "select" },
        },
        autoUpdateMode: {
            options: ["manual", "viewport", "auto"],
            control: { type: "select" },
        },
        recycle: { control: { type: "boolean" } },
        autoResizeItems: { control: { type: "boolean" } },
        itemLoadMode: {
            options: ["idle", "immediate"],
            control: { type: "select" },
        },
        idleCallbackTimeout: {
            control: { type: "text" },
        },
    },
} as Meta<FASTVirtualList>;

export const VirtualList: Story<FASTVirtualList> = renderComponent(storyTemplate).bind(
    {}
);

export const VirtualListHorizontal: Story<FASTVirtualList> = renderComponent(
    storyTemplate
).bind({});
VirtualListHorizontal.args = {
    orientation: "horizontal",
};

// const gridItemTemplate = html`
//     <div
//         style="
//             position: absolute;
//             background: lightblue;
//             contain: strict;
//             height:  100%;
//             width:  ${(x, c) => `${c.parent.visibleItemSpans[c.index]?.span}px`};
//             transform: ${(x, c) =>
//             `translateX(${c.parent.visibleItemSpans[c.index]?.start}px)`};
//         "
//     >
//         <div style="position: absolute; margin: 5px 20px 0 20px;">
//             ${x => x.title}
//         </div>
//         <image
//             style="
//                 position:absolute;
//                 height:100%;
//                 width:100%;
//             "
//             src="${x => x.url}"
//         ></image>
//     </div>
// `;

// const rowItemTemplate = html`
//     <fast-virtual-list
//         auto-update-mode="auto"
//         orientation="horizontal"
//         item-span="200"
//         viewport-buffer="200"
//         :viewportElement="${(x, c) => c.parent.viewportElement}"
//         :itemTemplate="${gridItemTemplate}"
//         :items="${x => x.items}"
//         style="
//             contain: size;
//             position: absolute;
//             width:  100%;
//             height:  ${(x, c) => `${c.parent.visibleItemSpans[c.index]?.span}px`};
//             transform: ${(x, c) =>
//             `translateY(${c.parent.visibleItemSpans[c.index]?.start}px)`};
//         "
//     ></fast-virtual-list>
// `;

// const gridStoryTemplate = html<StoryArgs<FASTVirtualList>>`
//     <fast-virtual-list
//         :sourceItems="${newDataSet(5000, 1)}"
//         :sizemap="${x => x.sizemap}"
//         viewport="${x => x.viewport}"
//         item-size="${x => x.itemSize}"
//         viewport-buffer="${x => x.viewportBuffer}"
//         orientation="${x => x.orientation}"
//         auto-update-mode="${x => x.autoUpdateMode}"
//         recycle="${x => x.recycle}"
//         auto-resize-items="${x => x.autoResizeItems}"
//         idle-load-mode="${x => x.idleLoadMode}"
//         idle-callback-timeout="${x => x.idleCallbackTimeout}"
//         list-item-load-mode="${x => x.listItemLoadMode}"
//         :itemContentsTemplate="${itemContentsTemplate}"
//     ></fast-virtual-list>
// `;

// export const VirtualListGrid: Story<FASTVirtualList> = renderComponent(
//     gridStoryTemplate
// ).bind({});
// VirtualListHorizontal.args = {
// };
