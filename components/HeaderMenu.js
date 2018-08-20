import React from 'react';
import { Menu } from 'semantic-ui-react';


class HeaderMenu extends React.Component {
    constructor(props) {
        super(props);

        var items = [
            {key: 'home', name: 'Home', as: 'a', href: '/'},
        ];

        this.state = {
            activeIndex: 0,
            items: items
        };
    }

    render() {
        return <div>
            <Menu
                    fixed='top'
                    inverted
                    pointing
                    items={ this.state.items }
                    activeIndex={ this.state.activeIndex }/>
        </div>
    }

};

export default HeaderMenu;