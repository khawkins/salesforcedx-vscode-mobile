/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const vscode = acquireVsCodeApi();

const topLevel = this;

window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.command) {
        case 'importLandingPage':
            topLevel.landingPage = message.payload;
            rerenderLandingPage();
            break;
    }
});

function rerenderLandingPage() {
    const cardContainerElement = document.getElementById('divLandingPageCards');
    cardContainerElement.innerHTML = '';
    const landingPage = topLevel.landingPage;
    if (
        landingPage &&
        landingPage.view &&
        landingPage.view.regions &&
        landingPage.view.regions.components &&
        landingPage.view.regions.components.components &&
        landingPage.view.regions.components.components.length > 0 &&
        landingPage.view.regions.components.components[0].regions &&
        landingPage.view.regions.components.components[0].regions
            .components &&
        landingPage.view.regions.components.components[0].regions
            .components.components &&
        landingPage.view.regions.components.components[0].regions
            .components.components.length > 0
    ) {
        for (cardComponent of landingPage.view.regions.components
            .components[0].regions.components.components) {
            // Create card div.
            const cardDivElement = document.createElement('div');
            const classAttr = document.createAttribute('class');
            classAttr.value = 'card';
            cardDivElement.setAttributeNode(classAttr);

            // Card title
            const cardTitleElement = document.createElement('h2');
            let titleText;
            if (cardComponent.properties && cardComponent.properties.label) {
                titleText = cardComponent.properties.label;
            } else {
                titleText = cardComponent.name;
            }
            cardTitleElement.appendChild(document.createTextNode(titleText));
            cardDivElement.appendChild(cardTitleElement);

            // Different card types will have different fields.
            const cardTypeHeaderElement = document.createElement('h3');
            cardTypeHeaderElement.appendChild(document.createTextNode('Type'));
            cardDivElement.appendChild(cardTypeHeaderElement);
            const cardComponentSubComponents =
                cardComponent.regions.components.components[0];
            let cardTypeElement;
            switch (cardComponentSubComponents.definition) {
                case 'mcf/list':
                    cardTypeElement = document.createElement('p');
                    cardTypeElement.appendChild(
                        document.createTextNode('List')
                    );
                    cardDivElement.appendChild(cardTypeElement);
                    console.log(`${titleText} is a 'mcf-list' component`);
                    addMcfListItems(cardComponentSubComponents, cardDivElement);
                    break;
                case 'mcfp/actionList':
                    cardTypeElement = document.createElement('p');
                    cardTypeElement.appendChild(
                        document.createTextNode('Global Actions')
                    );
                    cardDivElement.appendChild(cardTypeElement);
                    console.log(
                        `${titleText} is a 'mcfp/actionList' component`
                    );
                    addGlobalActionItems(
                        cardComponentSubComponents,
                        cardDivElement
                    );
                    break;
                case 'mcf/timedList':
                    cardTypeElement = document.createElement('p');
                    cardTypeElement.appendChild(
                        document.createTextNode('Timed List')
                    );
                    cardDivElement.appendChild(cardTypeElement);
                    console.log(`${titleText} is a 'mcf/timedList' component`);
                    addMcfListItems(cardComponentSubComponents, cardDivElement);
                    break;
            }

            cardContainerElement.appendChild(cardDivElement);
        }
    } else {
        // No cards configured.
        const noCardsElement = createEmptyListElement();
        cardContainerElement.appendChild(noCardsElement);
    }
}

function addMcfListItems(cardComponentSubComponents, cardDivElement) {
    const componentProperties = cardComponentSubComponents.properties;

    // Object API Name
    const objectApiNameHeaderElement = document.createElement('h3');
    objectApiNameHeaderElement.appendChild(
        document.createTextNode('Object API Name')
    );
    const objectApiNameElement = document.createElement('p');
    objectApiNameElement.appendChild(
        document.createTextNode(componentProperties.objectApiName)
    );
    cardDivElement.appendChild(objectApiNameHeaderElement);
    cardDivElement.appendChild(objectApiNameElement);

    // Display (fieldMap) fields
    for (displayField of [
        { type: 'mainField', display: 'Main field' },
        { type: 'subField1', display: 'Subfield' },
        { type: 'subField2', display: 'Subfield' },
        { type: 'startTime', display: 'Start time field' },
        { type: 'endTime', display: 'End time field' }
    ]) {
        if (
            componentProperties.fieldMap &&
            componentProperties.fieldMap[displayField.type]
        ) {
            const fieldMapHeaderElement = document.createElement('h3');
            fieldMapHeaderElement.appendChild(
                document.createTextNode(displayField.display)
            );
            const fieldMapElement = document.createElement('p');
            fieldMapElement.appendChild(
                document.createTextNode(
                    componentProperties.fieldMap[displayField.type]
                )
            );
            cardDivElement.appendChild(fieldMapHeaderElement);
            cardDivElement.appendChild(fieldMapElement);
        }
    }

    // Swipe actions
    if (componentProperties.swipeActions) {
        const swipeActionsHeaderElement = document.createElement('h3');
        swipeActionsHeaderElement.appendChild(
            document.createTextNode('Swipe Action(s)')
        );
        cardDivElement.appendChild(swipeActionsHeaderElement);
        for (swipeAction of Object.keys(componentProperties.swipeActions)) {
            const swipeActionHeaderElement = document.createElement('h4');
            swipeActionHeaderElement.appendChild(
                document.createTextNode(swipeAction)
            );
            const swipeActionConfig =
                componentProperties.swipeActions[swipeAction][0];
            const swipeActionConfigLabelElement = document.createElement('p');
            swipeActionConfigLabelElement.appendChild(
                document.createTextNode(`label: ${swipeActionConfig.label}`)
            );
            const swipeActionConfigValueElement = document.createElement('p');
            switch (swipeAction) {
                case 'map':
                    swipeActionConfigValueElement.appendChild(
                        document.createTextNode(
                            `address: ${swipeActionConfig.value.address}`
                        )
                    );
                    break;
                case 'call':
                case 'email':
                    swipeActionConfigValueElement.appendChild(
                        document.createTextNode(
                            `value: ${swipeActionConfig.value}`
                        )
                    );
                    break;
            }
            cardDivElement.appendChild(swipeActionHeaderElement);
            cardDivElement.appendChild(swipeActionConfigLabelElement);
            cardDivElement.appendChild(swipeActionConfigValueElement);
        }
    }
}

function addGlobalActionItems(cardComponentSubComponents, cardDivElement) {
    const globalActionsList =
        cardComponentSubComponents.regions.components.components;
    for (globalAction of globalActionsList) {
        const globalActionHeaderElement = document.createElement('h3');
        globalActionHeaderElement.appendChild(
            document.createTextNode('Action Item')
        );
        cardDivElement.appendChild(globalActionHeaderElement);
        const actionApiName = globalAction.properties.apiName;
        const actionApiNameElement = document.createElement('p');
        actionApiNameElement.appendChild(
            document.createTextNode(actionApiName)
        );
        cardDivElement.appendChild(actionApiNameElement);
    }
}

function createEmptyListElement() {
    const noCardsElement = document.createElement('p');
    noCardsElement.appendChild(
        document.createTextNode(
            "No landing page cards have been configured. Click 'Add'" +
                " to start configuring cards, or 'Open Template' to start" +
                ' with a pre-configured landing page experience.'
        )
    );
    return noCardsElement;
}

const btnOpenTemplate = document.getElementById('btnOpenTemplate');
btnOpenTemplate.addEventListener('click', () => {
    const selTemplateTypes = document.getElementById('selTemplateTypes');
    const selectedValue = selTemplateTypes.value;
    vscode.postMessage({ openTemplateId: selectedValue });
    toggleOpenTemplateModalVisibility(false);
});

const btnCancelOpenTemplate = document.getElementById('btnCancelOpenTemplate');
btnCancelOpenTemplate.addEventListener('click', () => {
    toggleOpenTemplateModalVisibility(false);
});

const lnkOpenTemplate = document.getElementById('lnkOpenTemplate');
lnkOpenTemplate.addEventListener('click', () => {
    toggleOpenTemplateModalVisibility(true);
});

const lnkAddCard = document.getElementById('lnkAddCard');
lnkAddCard.addEventListener('click', () => {
    toggleAddCardModalVisibility(true);
});

const btnCancelAddCard = document.getElementById('btnCancelAddCard');
btnCancelAddCard.addEventListener('click', () => {
    toggleAddCardModalVisibility(false);
});

const divCardTypeGlobal = document.getElementById('divCardTypeGlobal');
const divCardTypeList = document.getElementById('divCardTypeList');
const divCardTypeTimedList = document.getElementById('divCardTypeTimedList');
const selCardTypes = document.getElementById('selCardTypes');
selCardTypes.addEventListener('change', () => {
    switch (selCardTypes.value) {
        case 'global':
            divCardTypeGlobal.style.display = 'block';
            divCardTypeList.style.display = 'none';
            divCardTypeTimedList.style.display = 'none';
            break;
        case 'list':
            divCardTypeGlobal.style.display = 'none';
            divCardTypeList.style.display = 'block';
            divCardTypeTimedList.style.display = 'none';
            break;
        case 'timedList':
            divCardTypeGlobal.style.display = 'none';
            divCardTypeList.style.display = 'none';
            divCardTypeTimedList.style.display = 'block';
            break;
        default:
            divCardTypeGlobal.style.display = 'none';
            divCardTypeList.style.display = 'none';
            divCardTypeTimedList.style.display = 'none';
            break;
    }
});

const btnAddCard = document.getElementById('btnAddCard');
btnAddCard.addEventListener('click', () => {
    for (cardType of [
        { element: divCardTypeGlobal, method: addGlobalCard },
        { element: divCardTypeList, method: addListCard },
        { element: divCardTypeTimedList, method: addTimedListCard }
    ]) {
        if (cardType.element.style.display === 'block') {
            cardType.method();
            break;
        }
    }
    toggleAddCardModalVisibility(false);
});

function addGlobalCard() {
    const landingPage = topLevel.landingPage;
    console.log(`Original landingPage: ${JSON.stringify(landingPage)}`);
    const newCard = createCardTemplateObj();
    newCard.name = 'global_actions';
    newCard.properties.label = 'Global Actions';
    newCard.regions.components.components[0].definition = 'mcfp/actionList';
    newCard.regions.components.components[0].name = 'actions_list';
    newCard.regions.components.components[0].regions.components.components.push(
        {
            definition: 'mcfp/actionItem',
            name: 'global_action',
            properties: {
                apiName: document.getElementById('txtGlobalActionApi1').value
            },
            regions: {}
        }
    );
    landingPage.view.regions.components.components[0].regions.components.components.push(
        newCard
    );
    console.log(`Resultant landingPage: ${JSON.stringify(landingPage, null, 2)}`);
}

function addListCard() {}

function addTimedListCard() {}

function toggleOpenTemplateModalVisibility(visible) {
    toggleModalVisibility('divOpenTemplate', visible);
}

function toggleAddCardModalVisibility(visible) {
    toggleModalVisibility('divAddCard', visible);
}

function toggleModalVisibility(elementId, visible) {
    const displayValue = visible ? 'block' : 'none';
    const divModalElement = document.getElementById(elementId);
    divModalElement.style.display = displayValue;
}

function createCardTemplateObj() {
    return {
        definition: 'mcf/card',
        name: '',
        properties: {
            label: ''
        },
        regions: {
            components: {
                name: 'components',
                components: [
                    {
                        definition: '',
                        name: '',
                        properties: {},
                        regions: {
                            components: {
                                name: 'components',
                                components: []
                            }
                        }
                    }
                ]
            }
        }
    };
}
