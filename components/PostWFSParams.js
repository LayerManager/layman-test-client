import {Form} from 'semantic-ui-react'
import UserPathParams from "./UserPathParams";

class PostWFSParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Input
              className="mandatory"
              name="data"
              label='Query XML'
              placeholder='XML query'
              value={this.props.data}
              rows={50}
              onChange={this.props.handleDataChange}/>
        </div>
    );
  }
}

export default PostWFSParams;

