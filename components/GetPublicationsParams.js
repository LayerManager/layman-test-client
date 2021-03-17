import {Form} from 'semantic-ui-react'
import FormDropdown from './FormDropdown'

class GetPublicationsParams extends React.PureComponent {

  render() {
    return (
        <div>
          <Form.Input
              inline
              name="full_text_filter" label='Full-text filter'
              placeholder='Full-text filter'/>
          <FormDropdown
              options={[
                {key: 1, text: 'No value', value: ''},
                {key: 2, text: 'Full-text', value: 'full_text'},
                {key: 3, text: 'Title', value: 'title'},
              ]}
              placeholder='Choose how to order publications'
              label='Order by'
              additionLabel='Custom value: '
              name="order_by"
          />
        </div>
    );
  }
}

export default GetPublicationsParams;

