import HeaderMenu from "../components/HeaderMenu";
import {List, Container, Form, Header, Ref, Tab} from "semantic-ui-react";

const containerStyle = {
  position: 'absolute',
  top: '40px',
  padding: '1em',
};

function Profile({ user }) {
    // todo show also information from GET current-user
    return (
        <div>
          <HeaderMenu user={user} />

          <Container style={containerStyle}>
            <Header as='h1'>Client-side user information</Header>
            <List bulleted>
              { Object.keys(user).map(key => (
                <List.Item key={key}>{key}: {user[key].toString()}</List.Item>
              ))}
            </List>
          </Container>
        </div>
    );
}

export default Profile;
