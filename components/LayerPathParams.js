import {Form} from 'semantic-ui-react'
import WorkspacePathParams from "./WorkspacePathParams";

class LayerPathParams extends React.PureComponent {

  render() {
    return (
        <div>
          <WorkspacePathParams workspace={this.props.workspace} handleWorkspaceChange={this.props.handleWorkspaceChange}/>
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

