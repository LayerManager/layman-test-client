import React from "react";
import App from "next/app";
import Head from 'next/head'
import getConfig from 'next/config'
import fetch from 'isomorphic-unfetch';
const { publicRuntimeConfig } = getConfig();


const anonymous_user = {
  authenticated: false,
  display_name: 'Anonymous',
};

class MyApp extends App {
  static async getInitialProps({Component, ctx}) {
    console.log('_app.js getInitialProps');
    let pageProps = {};
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }
    if (ctx.req) {
      const providers = require('../src/authn/providers').default();
      const num_authn_providers = Object.keys(providers).length;
      pageProps.num_authn_providers = num_authn_providers;
    }
    if (ctx?.req?.session?.passport?.user) {
      const user_util = require('../src/authn/user').default;
      const authn_util = require('../src/authn/util').default;
      await authn_util.refresh_authn_info_if_needed(ctx.req);
      let authn_error = ctx.req.session.authn_error;
      // check user again, because refresh_authn_info_if_needed could logout automatically
      if(ctx.req.session.passport.user) {
        try {
          await user_util.check_current_user(ctx.req);
        } catch (e) {
          authn_error = e.toString();
        }
      }
      if(authn_error) {
        pageProps.authn_error = authn_error;
      }
      // check user again, because check_current_user could logout automatically
      if (ctx.req.session.passport.user) {
        pageProps.user = {
          authenticated: true,
          username: ctx.req.session.passport.user.username,
          display_name: ctx.req.session.passport.user.display_name,
        };
      }
    }
    // console.log(`_app.js getInitialProps pageProps=${JSON.stringify(pageProps)}`);
    return {pageProps};
  }

  constructor(props) {
    console.log(`_app.js constructor pageProps=${JSON.stringify(props.pageProps)}`);
    super(props);
    const user = props.pageProps.user || JSON.parse(JSON.stringify(anonymous_user));
    if(props.pageProps.authn_error) {
      user.latest_authn_error = props.pageProps.authn_error;
    }
    const num_authn_providers = props.pageProps.num_authn_providers;
    this.state = {
      user,
      num_authn_providers,
    };

  }
  componentDidMount() {
    setInterval(this.refresh_user.bind(this), publicRuntimeConfig.REFRESH_USER_INTERVAL*1000);
  }

  async refresh_user() {
    const res = await fetch(`${publicRuntimeConfig.ASSET_PREFIX}/current-user-props`);
    const json = await res.json();
    // console.log('refresh_user', json);
    const user = json.authenticated ? json : JSON.parse(JSON.stringify(anonymous_user));
    if(!json.authenticated && (json.authn_error || this.state.user.latest_authn_error)) {
      user.latest_authn_error = json.authn_error || this.state.user.latest_authn_error;
    }
    console.log('setting state', user);
    this.setState({
      user,
    });
  };

  render() {
    // console.log(`_app.js render state=${JSON.stringify(this.state)}`);
    // console.log(`_app.js render this.props.pageProps=${JSON.stringify(this.props.pageProps)}`);
    const {Component, pageProps} = this.props;

    const props = {
      ...pageProps,
      num_authn_providers: this.state.num_authn_providers,
      user: this.state.user,
      handle_authn_failed: this.refresh_user.bind(this),
    };

    return (
        <>
          <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          </Head>
          <Component {...props} />
        </>
  )
    ;
  }
}

export default MyApp;