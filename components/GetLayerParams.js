import {Form} from 'semantic-ui-react'

class PostLayersParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Input
              inline
              name="name"
              label='Layer name'
              placeholder='Layer name'
              value={this.props.layername}
              onChange={this.props.onLayernameChange}/>
        </div>
    );
  }
}

export default PostLayersParams;

