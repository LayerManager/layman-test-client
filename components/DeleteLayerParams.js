import {Form} from 'semantic-ui-react'

class DeleteLayerParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Input
              inline
              className="mandatory"
              name="name"
              label='Layer name'
              placeholder='Layer name'
              value={this.props.layername}
              onChange={this.props.onLayernameChange}/>
        </div>
    );
  }
}

export default DeleteLayerParams;

