import {Form} from 'semantic-ui-react'

class PostStyleInfoParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Field inline className="mandatory">
            <label>Style file</label>
            <input name="style" type="file" />
          </Form.Field>
        </div>
    );
  }
}

export default PostStyleInfoParams;

