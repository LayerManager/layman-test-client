import React from 'react';
import {Icon, Menu} from 'semantic-ui-react';
import Link from 'next/link'


class HeaderMenu extends React.Component {
  constructor(props) {
    super(props);

    let user_label = `${props.user.display_name}`;
    user_label += props.user.authenticated ? `, username: ${props.user.username}` : '';
    const items = [
      {key: 'home', name: 'Home', href: '/'},
      {key: 'profile', icon: 'user', name: user_label, href: '/profile'},
    ];

    if (props.user.authenticated) {
      items.push(...[
          {key: 'logout', name: 'Log Out', href: '/auth/logout', simple_link: true},
      ])
    } else {
      items.push(...[
          {key: 'login', name: 'Log In', href: '/auth/oauth2-liferay/login', simple_link: true},
      ])
    }


    this.state = {
      activeIndex: 0,
      items: items
    };
  }

  render() {

    const items = this.state.items.map(item_def => {
      return item_def.simple_link
          ? <Menu.Item key={item_def.key} as="a" href={item_def.href}>{item_def.name}</Menu.Item>
          : <Link key={item_def.key} href={item_def.href} passHref>
            <Menu.Item as="a">{item_def.icon ? <Icon name={item_def.icon} /> : null}{item_def.name}</Menu.Item>
          </Link>;
    });

    return <div>
      <Menu
          fixed='top'
          inverted
          pointing
          activeIndex={this.state.activeIndex}
      >
        {items}
      </Menu>
    </div>
  }

};

export default HeaderMenu;