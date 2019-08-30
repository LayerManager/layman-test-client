import {Form} from 'semantic-ui-react'

class UserPathParams extends React.PureComponent {

  render() {
    return (
        <Form.Input
            inline
            className="mandatory"
            name="user"
            label='User name'
            placeholder='User name'
            value={this.props.user}
            onChange={this.props.handleUserChange}/>
    );
  }
}

export default UserPathParams;

