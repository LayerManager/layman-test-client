import React from 'react';
import {Icon, Menu} from 'semantic-ui-react';
import Link from 'next/link'
import getConfig from 'next/config'
const { publicRuntimeConfig } = getConfig();


class HeaderMenu extends React.Component {
  constructor(props) {
    super(props);



    this.state = {
      activeIndex: 0,
    };
  }

  render() {
    const props = this.props;
    const ASSET_PREFIX = publicRuntimeConfig.ASSET_PREFIX;

    let user_label = `${props.user.display_name}`;
    user_label += props.user.authenticated ? `, username: ${props.user.username}` : '';
    const items_def = [
      {key: 'home', name: 'REST API', href: '/'},
      {key: 'wfs', name: 'WFS', href: '/wfs'},
      {key: 'profile', icon: 'user', name: user_label, href: '/profile'},
    ];
    if (props.show_log) {
      if (props.user.authenticated) {
        items_def.push(...[
          {key: 'logout', name: 'Log Out', href: '/authn/logout', simple_link: true},
        ])
      } else {
        items_def.push(...[
          {key: 'login', name: 'Log In', href: '/authn/oauth2-liferay/login', simple_link: true},
        ])
      }
    }

    const items = items_def.map(item_def => {
      return item_def.simple_link
          ? <Menu.Item key={item_def.key} as="a" href={`${ASSET_PREFIX}${item_def.href}`}>{item_def.name}</Menu.Item>
          : <Link key={item_def.key} href={item_def.href} as={`${ASSET_PREFIX}${item_def.href}`} passHref>
            <Menu.Item as="div">{item_def.icon ? <Icon name={item_def.icon} /> : null}{item_def.name}</Menu.Item>
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