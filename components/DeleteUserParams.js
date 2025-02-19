import React from 'react'
import {Form, Checkbox} from 'semantic-ui-react'

class DeleteUserParams extends React.PureComponent {

  render() {
    const { username, handleUsernameChange } = this.props;
    return (
        <div>
          <Form.Input
              inline
              name="username"
              label='Username'
              placeholder='Username'
              value={username}
              onChange={handleUsernameChange}
              />
        </div>
    );
  }
}

export default DeleteUserParams;

