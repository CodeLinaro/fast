import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { fixtureURL } from "../__test__/helpers.js";

// eslint-disable-next-line no-restricted-imports
import type {
    CheckableFormAssociatedElement,
    FormAssociatedElement,
} from "./stories/form-associated.register.js";

test.describe("FormAssociated", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(fixtureURL("debug--blank"));

        await page.waitForFunction(() =>
            Promise.all([
                customElements.whenDefined("test-element"),
                customElements.whenDefined("custom-initial-value"),
                customElements.whenDefined("checkable-form-associated"),
            ])
        );
    });

    test("should have an empty string value prior to connectedCallback", async ({
        page,
    }) => {
        await page.setContent(``);

        const [value, currentValue] = await page.evaluate(() => {
            const el = document.createElement("test-element") as FormAssociatedElement;

            return [el.value, el.currentValue];
        });

        expect(value).toBe("");

        expect(currentValue).toBe("");
    });

    test("should initialize to the initial value if no value property is set", async ({
        page,
    }) => {
        const element = page.locator("test-element");

        await page.setContent(``);

        await page.evaluate(() => {
            const el = document.createElement("test-element") as FormAssociatedElement;

            el.initialValue = "foobar";

            document.body.append(el);
        });

        await expect(element).toHaveJSProperty("value", "foobar");

        await expect(element).toHaveJSProperty("currentValue", "foobar");

        await expect(element).toHaveJSProperty("initialValue", "foobar");
    });

    test("should initialize to the provided value ATTRIBUTE if set pre-connection", async ({
        page,
    }) => {
        const element = page.locator("test-element");

        await page.setContent(``);

        await page.evaluate(() => {
            const el = document.createElement("test-element") as FormAssociatedElement;

            el.setAttribute("value", "foobar");

            document.body.append(el);
        });

        await expect(element).toHaveJSProperty("value", "foobar");

        await expect(element).toHaveJSProperty("currentValue", "foobar");
    });

    test("should initialize to the provided value ATTRIBUTE if set post-connection", async ({
        page,
    }) => {
        const element = page.locator("test-element");

        await page.setContent(/* html */ `
            <test-element></test-element>
        `);

        await element.evaluate((node: FormAssociatedElement) => {
            node.setAttribute("value", "foobar");
        });

        await expect(element).toHaveJSProperty("value", "foobar");

        await expect(element).toHaveJSProperty("currentValue", "foobar");
    });

    test("should initialize to the provided value PROPERTY if set pre-connection", async ({
        page,
    }) => {
        const element = page.locator("test-element");

        await page.setContent(``);

        await page.evaluate(() => {
            const el = document.createElement("test-element") as FormAssociatedElement;

            el.value = "foobar";

            document.body.append(el);
        });

        await expect(element).toHaveJSProperty("value", "foobar");

        await expect(element).toHaveJSProperty("currentValue", "foobar");
    });

    test("should initialize to the provided value PROPERTY if set post-connection", async ({
        page,
    }) => {
        const element = page.locator("test-element");

        await page.setContent(/* html */ `
            <test-element></test-element>
        `);

        await element.evaluate((node: FormAssociatedElement) => {
            node.value = "foobar";
        });

        await expect(element).toHaveJSProperty("value", "foobar");

        await expect(element).toHaveJSProperty("currentValue", "foobar");
    });

    test("should initialize to the initial value when initial value is assigned by extending class", async ({
        page,
    }) => {
        const element = page.locator("custom-initial-value");

        await page.setContent(/* html */ `
            <custom-initial-value></custom-initial-value>
        `);

        await expect(element).toHaveJSProperty("value", "foobar");

        await expect(element).toHaveJSProperty("currentValue", "foobar");
    });

    test("should communicate initial value to the parent form", async ({ page }) => {
        const form = page.locator("form");

        await page.setContent(/* html */ `
            <form>
                <custom-initial-value name="test"></custom-initial-value>
            </form>
        `);

        expect(
            await form.evaluate((node: HTMLFormElement) => new FormData(node).get("test"))
        ).toBe("foobar");
    });

    test.describe("changes:", () => {
        test("setting value ATTRIBUTE should set value if value PROPERTY has not been explicitly set", async ({
            page,
        }) => {
            const element = page.locator("test-element");

            await page.setContent(/* html */ `
                <test-element></test-element>
            `);

            await element.evaluate((node: FormAssociatedElement) => {
                node.setAttribute("value", "foo");
            });

            await expect(element).toHaveJSProperty("value", "foo");

            await expect(element).toHaveJSProperty("currentValue", "foo");

            await element.evaluate((node: FormAssociatedElement) => {
                node.setAttribute("value", "bar");
            });

            await expect(element).toHaveJSProperty("value", "bar");

            await expect(element).toHaveJSProperty("currentValue", "bar");
        });

        test("setting value ATTRIBUTE should not set value if value PROPERTY has been explicitly set", async ({
            page,
        }) => {
            const element = page.locator("test-element");

            await page.setContent(/* html */ `
                <test-element></test-element>
            `);

            await element.evaluate((node: FormAssociatedElement) => {
                node.value = "foo";
            });

            await expect(element).toHaveJSProperty("value", "foo");

            await expect(element).toHaveJSProperty("currentValue", "foo");

            await element.evaluate((node: FormAssociatedElement) => {
                node.setAttribute("value", "bar");
            });

            await expect(element).toHaveJSProperty("value", "foo");

            await expect(element).toHaveJSProperty("currentValue", "foo");
        });

        test("setting value ATTRIBUTE should set parent form value if value PROPERTY has not been explicitly set", async ({
            page,
        }) => {
            const element = page.locator("test-element");

            await page.setContent(/* html */ `
                <form>
                    <test-element name="test"></test-element>
                </form>
            `);

            const form = page.locator("form");

            await element.evaluate((node: FormAssociatedElement) => {
                node.setAttribute("value", "foo");
            });

            expect(
                await form.evaluate((node: HTMLFormElement) => {
                    const formData = new FormData(node);

                    return formData.get("test");
                })
            ).toBe("foo");

            await element.evaluate((node: FormAssociatedElement) => {
                node.setAttribute("value", "bar");
            });

            expect(
                await form.evaluate((node: HTMLFormElement) => {
                    const formData = new FormData(node);

                    return formData.get("test");
                })
            ).toBe("bar");
        });

        test("setting value PROPERTY should set parent form value", async ({ page }) => {
            const element = page.locator("test-element");

            await page.setContent(/* html */ `
                <form>
                    <test-element name="test"></test-element>
                </form>
            `);

            const form = page.locator("form");

            await element.evaluate((node: FormAssociatedElement) => {
                node.value = "foo";
            });

            expect(
                await form.evaluate((node: HTMLFormElement) => {
                    const formData = new FormData(node);

                    return formData.get("test");
                })
            ).toBe("foo");

            await element.evaluate((node: FormAssociatedElement) => {
                node.value = "bar";
            });

            expect(
                await form.evaluate((node: HTMLFormElement) => {
                    const formData = new FormData(node);

                    return formData.get("test");
                })
            ).toBe("bar");
        });

        test("assigning the currentValue property should set the controls value property to the same value", async ({
            page,
        }) => {
            const element = page.locator("test-element");

            await page.setContent(/* html */ `
                <test-element>test element</test-element>
            `);

            await element.waitFor({ state: "attached" });

            await expect(element).toHaveJSProperty("value", "");

            await expect(element).toHaveJSProperty("currentValue", "");

            await element.evaluate((node: FormAssociatedElement) => {
                node.currentValue = "foo";
            });

            await expect(element).toHaveJSProperty("value", "foo");

            await expect(element).toHaveJSProperty("currentValue", "foo");
        });

        test("setting the current-value property should set the controls value property to the same value", async ({
            page,
        }) => {
            const element = page.locator("test-element");

            await page.setContent(/* html */ `
                <test-element></test-element>
            `);

            await expect(element).toHaveJSProperty("value", "");

            await expect(element).toHaveJSProperty("currentValue", "");

            await element.evaluate((node: FormAssociatedElement) => {
                node.setAttribute("current-value", "foo");
            });

            await expect(element).toHaveJSProperty("value", "foo");

            await expect(element).toHaveJSProperty("currentValue", "foo");
        });
    });

    test.describe("when the owning form's reset() method is invoked", () => {
        test("should reset it's value property to an empty string if no value attribute is set", async ({
            page,
        }) => {
            const element = page.locator("test-element");

            await page.setContent(/* html */ `
                <form>
                    <test-element name="test"></test-element>
                </form>
            `);

            const form = page.locator("form");

            await element.evaluate((node: FormAssociatedElement) => {
                node.value = "foo";
            });

            await expect(element).toHaveJSProperty("value", "foo");

            await expect(element).toHaveJSProperty("currentValue", "foo");

            await expect(element).not.toHaveAttribute("value");

            await form.evaluate((node: HTMLFormElement) => {
                node.reset();
            });

            await expect(element).toHaveJSProperty("value", "");

            await expect(element).toHaveJSProperty("currentValue", "");

            await expect(element).not.toHaveAttribute("value");
        });

        test("should reset it's value property to the value of the value attribute if it is set", async ({
            page,
        }) => {
            const element = page.locator("test-element");

            await page.setContent(/* html */ `
                <form>
                    <test-element name="test" value="attr-value"></test-element>
                </form>
            `);

            const form = page.locator("form");

            await expect(element).toHaveJSProperty("value", "attr-value");

            await expect(element).toHaveJSProperty("currentValue", "attr-value");

            await expect(element).toHaveAttribute("value", "attr-value");

            await element.evaluate((node: FormAssociatedElement) => {
                node.value = "prop-value";
            });

            await expect(element).toHaveJSProperty("value", "prop-value");

            await expect(element).toHaveJSProperty("currentValue", "prop-value");

            await expect(element).toHaveAttribute("value", "attr-value");

            await form.evaluate((node: HTMLFormElement) => {
                node.reset();
            });

            await expect(element).toHaveJSProperty("value", "attr-value");

            await expect(element).toHaveJSProperty("currentValue", "attr-value");

            await expect(element).toHaveAttribute("value", "attr-value");
        });
        /* eslint-disable-next-line max-len */
        test("should put the control into a clean state, where modifcations to the `value` attribute update the `value` property prior to user or programmatic interaction", async ({
            page,
        }) => {
            const element = page.locator("test-element");

            await page.setContent(/* html */ `
                <form>
                    <test-element name="test" value="attr-value"></test-element>
                </form>
            `);

            const form = page.locator("form");

            await expect(element).toHaveJSProperty("value", "attr-value");

            await expect(element).toHaveJSProperty("currentValue", "attr-value");

            await expect(element).toHaveAttribute("value", "attr-value");

            await element.evaluate((node: FormAssociatedElement) => {
                node.value = "prop-value";
            });

            await expect(element).toHaveJSProperty("value", "prop-value");

            await expect(element).toHaveJSProperty("currentValue", "prop-value");

            await expect(element).toHaveAttribute("value", "attr-value");

            await form.evaluate((node: HTMLFormElement) => {
                node.reset();
            });

            await expect(element).toHaveJSProperty("value", "attr-value");

            await expect(element).toHaveJSProperty("currentValue", "attr-value");

            await expect(element).toHaveAttribute("value", "attr-value");

            await element.evaluate((node: FormAssociatedElement) => {
                node.setAttribute("value", "new-attr-value");
            });

            await expect(element).toHaveJSProperty("value", "new-attr-value");

            await expect(element).toHaveJSProperty("currentValue", "new-attr-value");

            await expect(element).toHaveAttribute("value", "new-attr-value");
        });
    });

    test.describe("CheckableFormAssociated", () => {
        test("should have a 'checked' property that is initialized to false", async ({
            page,
        }) => {
            const element = page.locator("checkable-form-associated");

            await page.setContent(/* html */ `
                    <checkable-form-associated></checkable-form-associated>
                `);

            await expect(element).toHaveJSProperty("checked", false);

            await expect(element).toHaveJSProperty("currentChecked", false);

            await expect(element).toHaveAttribute("current-checked", "false");
        });

        test("should align the `currentChecked` property and `current-checked` attribute with `checked` property changes", async ({
            page,
        }) => {
            const element = page.locator("checkable-form-associated");

            await page.setContent(/* html */ `
                    <checkable-form-associated></checkable-form-associated>
                `);

            await expect(element).toHaveJSProperty("checked", false);

            await expect(element).toHaveJSProperty("currentChecked", false);

            await expect(element).toHaveAttribute("current-checked", "false");

            await element.evaluate((node: CheckableFormAssociatedElement) => {
                node.checked = true;
            });

            await expect(element).toHaveJSProperty("checked", true);

            await expect(element).toHaveJSProperty("currentChecked", true);

            await expect(element).toHaveAttribute("current-checked", "true");

            await element.evaluate((node: CheckableFormAssociatedElement) => {
                node.checked = false;
            });

            await expect(element).toHaveJSProperty("checked", false);

            await expect(element).toHaveJSProperty("currentChecked", false);

            await expect(element).toHaveAttribute("current-checked", "false");
        });

        test("should align the `checked` property and `current-checked` attribute with `currentChecked` property changes", async ({
            page,
        }) => {
            const element = page.locator("checkable-form-associated");

            await page.setContent(/* html */ `
                    <checkable-form-associated></checkable-form-associated>
                `);

            await expect(element).toHaveJSProperty("checked", false);

            await expect(element).toHaveJSProperty("currentChecked", false);

            await expect(element).toHaveAttribute("current-checked", "false");

            await element.evaluate((node: CheckableFormAssociatedElement) => {
                node.setAttribute("current-checked", "true");
            });

            await expect(element).toHaveJSProperty("checked", true);

            await expect(element).toHaveJSProperty("currentChecked", true);

            await expect(element).toHaveAttribute("current-checked", "true");

            await element.evaluate((node: CheckableFormAssociatedElement) => {
                node.setAttribute("current-checked", "false");
            });

            await expect(element).toHaveJSProperty("checked", false);

            await expect(element).toHaveJSProperty("currentChecked", false);

            await expect(element).toHaveAttribute("current-checked", "false");
        });
    });
});
