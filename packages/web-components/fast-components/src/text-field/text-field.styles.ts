import { css, ElementStyles } from "@microsoft/fast-element";
import {
    display,
    forcedColorsStylesheetBehavior,
    FoundationElementTemplate,
    TextFieldOptions,
} from "@microsoft/fast-foundation";
import { designUnit } from "../design-tokens.js";
import {
    inputFilledForcedColorStyles,
    inputFilledStyles,
    inputForcedColorStyles,
    inputStateStyles,
    inputStyles,
} from "../styles/index.js";
import { appearanceBehavior } from "../utilities/behaviors.js";

export const textFieldFilledStyles: FoundationElementTemplate<
    ElementStyles,
    TextFieldOptions
> = (context, definition) =>
    css`
        ${inputFilledStyles(context, definition, ".root")}
    `.withBehaviors(
        forcedColorsStylesheetBehavior(
            css`
                ${inputFilledForcedColorStyles(context, definition, ".root")}
            `
        )
    );

/**
 * Styles for Text Field
 * @public
 */
export const textFieldStyles: FoundationElementTemplate<
    ElementStyles,
    TextFieldOptions
> = (context, definition) =>
    css`
        ${display("inline-block")}
        ${inputStyles(context, definition, ".root")}
        ${inputStateStyles(context, definition, ".root")}
        .root {
            display: flex;
            flex-direction: row;
            align-items: baseline;
        }

        .control {
            -webkit-appearance: none;
            color: inherit;
            background: transparent;
            border: 0;
            height: calc(100% - 4px);
            margin-top: auto;
            margin-bottom: auto;
            padding: 0 calc(${designUnit} * 2px + 1px);
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
        }

        .start,
        .control,
        .end {
            align-self: center;
        }

        .start,
        .end {
            display: flex;
            margin: auto;
        }

        .start {
            display: flex;
            margin-inline-start: 11px;
        }

        .end {
            display: flex;
            margin-inline-end: 11px;
        }
  `.withBehaviors(
        appearanceBehavior("filled", textFieldFilledStyles(context, definition)),
        forcedColorsStylesheetBehavior(
            css`
                ${inputForcedColorStyles(context, definition, ".root")}
            `
        )
    );
