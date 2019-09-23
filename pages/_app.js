import React from "react";
import App, {Container as NextContainer} from "next/app";

class MyApp extends App {
  static async getInitialProps({Component, ctx}) {
    console.log('_app.js getInitialProps');
    let pageProps = {};
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }
    if (ctx.req && ctx.req.session.passport) {
      console.log('_app.js getInitialProps ctx.req.session', Object.keys(ctx.req.session));
      if (ctx.req.session.passport) {
        console.log('_app.js getInitialProps ctx.req.session.passport', Object.keys(ctx.req.session.passport));
        if (ctx.req.session.passport.user) {
          console.log('_app.js getInitialProps ctx.req.session.passport.user', Object.keys(ctx.req.session.passport.user));
          pageProps.user = {
            authenticated: true,
            username: ctx.req.session.passport.user.username,
            display_name: ctx.req.session.passport.user.display_name,
          };
        }
      }
    }
    // todo if this runs on client-side, it's always anonymous, and correct user is passed in render() from state
    if (!pageProps.user) {
      pageProps.user = {
            authenticated: false,
            display_name: 'Anonymous',
      }
    }
    console.log(`_app.js getInitialProps pageProps=${JSON.stringify(pageProps)}`);
    return {pageProps};
  }

  constructor(props) {
    console.log(`_app.js constructor pageProps=${JSON.stringify(props.pageProps)}`);
    super(props);
    this.state = {
      user: props.pageProps.user
    };
  }

  render() {
    console.log(`_app.js render state=${JSON.stringify(this.state)}`);
    console.log(`_app.js render this.props.pageProps=${JSON.stringify(this.props.pageProps)}`);
    const {Component, pageProps} = this.props;

    const props = {
      ...pageProps,
      user: this.state.user,
    };

    return (
        <NextContainer>
          <Component {...props} />
        </NextContainer>
    );
  }
}

export default MyApp;