import {Form} from 'semantic-ui-react'
import UserPathParams from "./UserPathParams";

class MapPathParams extends React.PureComponent {

  render() {
    return (
        <div>
          <UserPathParams user={this.props.user} handleUserChange={this.props.handleUserChange}/>
          <Form.Input
              inline
              className="mandatory"
              name="name"
              label='Map name'
              placeholder='Map name'
              value={this.props.mapname}
              onChange={this.props.handleMapnameChange}/>
        </div>
    );
  }
}

export default MapPathParams;

