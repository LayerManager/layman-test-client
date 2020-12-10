import {Form} from 'semantic-ui-react'

class WorkspacePathParams extends React.PureComponent {

  render() {
    return (
        <Form.Input
            inline
            className="mandatory"
            name="Workspace"
            label='Workspace name'
            placeholder='Workspace name'
            value={this.props.workspace}
            onChange={this.props.handleWorkspaceChange}/>
    );
  }
}

export default WorkspacePathParams;

