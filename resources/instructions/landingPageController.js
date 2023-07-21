let landingPage = {};

window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.command) {
        case 'importLandingPage':
            this.landingPage = message.payload;
            rerenderLandingPage();
            break;
    }
});

function rerenderLandingPage() {
    if (
        this.landingPage &&
        this.landingPage.view &&
        this.landingPage.view.regions &&
        this.landingPage.view.regions.components &&
        this.landingPage.view.regions.components.components &&
        this.landingPage.view.regions.components.components.length > 0 &&
        this.landingPage.view.regions.components.components[0].regions &&
        this.landingPage.view.regions.components.components[0].regions
            .components &&
        this.landingPage.view.regions.components.components[0].regions
            .components.components &&
        this.landingPage.view.regions.components.components[0].regions
            .components.components.length > 0
    ) {
        for (cardComponent of this.landingPage.view.regions.components
            .components[0].regions.components.components) {
            // Create card div.
            const cardDivElement = document.createElement('div');
            const classAttr = document.createAttribute('class');
            classAttr.value = 'card';
            cardDivElement.setAttributeNode(classAttr);

            // Card title
            const cardTitleElement = document.createElement('h1');
            let titleText;
            if (cardComponent.properties && cardComponent.properties.label) {
                titleText = cardComponent.properties.label;
            } else {
                titleText = cardComponent.name;
            }
            cardTitleElement.appendChild(document.createTextNode(titleText));
            cardDivElement.appendChild(cardTitleElement);

            // Different card types will have different fields.
            const cardTypeHeaderElement = document.createElement('h2');
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
                    break;
            }

            const cardContainerElement =
                document.getElementsByClassName('card-container')[0];
            cardContainerElement.appendChild(cardDivElement);
        }
    } else {
        // TODO: Add 'no cards' logic/UX.
        console.log('No cards found!');
    }
}

function addMcfListItems(cardComponentSubComponents, cardDivElement) {
    const componentProperties = cardComponentSubComponents.properties;

    // Object API Name
    const objectApiNameHeaderElement = document.createElement('h2');
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
        { type: 'subField2', display: 'Subfield' }
    ]) {
        if (
            componentProperties.fieldMap &&
            componentProperties.fieldMap[displayField.type]
        ) {
            const fieldMapHeaderElement = document.createElement('h2');
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
        const swipeActionsHeaderElement = document.createElement('h2');
        swipeActionsHeaderElement.appendChild(
            document.createTextNode('Swipe Action(s)')
        );
        cardDivElement.appendChild(swipeActionsHeaderElement);
        for (swipeAction of Object.keys(componentProperties.swipeActions)) {
            const swipeActionHeaderElement = document.createElement('h3');
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
            swipeActionConfigValueElement.appendChild(
                document.createTextNode(`value: ${swipeActionConfig.value}`)
            );
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
        const globalActionHeaderElement = document.createElement('h2');
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
