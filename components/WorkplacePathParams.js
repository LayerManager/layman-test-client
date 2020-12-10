import {Form} from 'semantic-ui-react'

class WorkplacePathParams extends React.PureComponent {

  render() {
    return (
        <Form.Input
            inline
            className="mandatory"
            name="workplace"
            label='Workplace name'
            placeholder='Workplace name'
            value={this.props.user}
            onChange={this.props.handleUserChange}/>
    );
  }
}

export default WorkplacePathParams;

