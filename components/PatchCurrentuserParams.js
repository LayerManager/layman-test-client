import {Form, Checkbox} from 'semantic-ui-react'

class PatchCurrentUserParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Field inline>
            <label>Adjust username</label>
            <Checkbox
                defaultChecked={true}
                value="true"
                name="adjust_username"
            />
          </Form.Field>
          <Form.Input
              inline
              name="username"
              label='Username'
              placeholder='Username'/>
        </div>
    );
  }
}

export default PatchCurrentUserParams;

