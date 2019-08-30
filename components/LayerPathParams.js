import {Form} from 'semantic-ui-react'
import UserPathParams from "./UserPathParams";

class LayerPathParams extends React.PureComponent {

  render() {
    return (
        <div>
          <UserPathParams user={this.props.user} handleUserChange={this.props.handleUserChange}/>
          <Form.Input
              inline
              className="mandatory"
              name="name"
              label='Layer name'
              placeholder='Layer name'
              value={this.props.layername}
              onChange={this.props.handleLayernameChange}/>
        </div>
    );
  }
}

export default LayerPathParams;

