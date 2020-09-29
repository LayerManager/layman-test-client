import {Form} from 'semantic-ui-react'

class PostWFSParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form>
            <textarea
              className="mandatory"
              name="data"
              label='XML Query'
              placeholder='XML Query'
              value={this.props.data}
              onChange={this.props.handleDataChange}/>
          </Form>
        </div>
    );
  }
}

export default PostWFSParams;

