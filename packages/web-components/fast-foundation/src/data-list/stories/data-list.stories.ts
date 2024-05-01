import { html } from "@microsoft/fast-element";
import type { Meta, Story, StoryArgs } from "../../__test__/helpers.js";
import { renderComponent } from "../../__test__/helpers.js";
import type { FASTDataList } from "../data-list.js";

// create a sample data set
function newDataSet(rowCount: number, prefix: number): object[] {
    const newData: object[] = [];
    for (let i = 1; i <= rowCount; i++) {
        newData.push({
            value: `${i}`,
            title: `item #${i}`,
            url: `https://picsum.photos/200/200?random=${prefix * 1000 + i}`,
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
        <div
            style="
                    height: 160px;
                    width:160px;
                    margin:10px 20px 10px 20px;
                    background-image: url('${x => x.itemData.url}');
            "
        ></div>
    </fast-card>
`;

const storyTemplate = html<StoryArgs<FASTDataList>>`
    <fast-data-list
        :sourceItems="${newDataSet(100, 1)}"
        orientation="${x => x.orientation}"
        recycle="${x => x.recycle}"
        :itemContentsTemplate="${itemContentsTemplate}"
    ></fast-data-list>
`;

export default {
    title: "Data List",
    argTypes: {
        orientation: {
            options: ["horizontal", "vertical"],
            control: { type: "select" },
        },
        recycle: { control: { type: "boolean" } },
    },
} as Meta<FASTDataList>;

export const DataList: Story<FASTDataList> = renderComponent(storyTemplate).bind({});

export const DataListHorizontal: Story<FASTDataList> = renderComponent(
    storyTemplate
).bind({});
DataListHorizontal.args = {
    orientation: "horizontal",
};
