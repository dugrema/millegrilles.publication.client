import React from 'react'
import ReactSummernote from 'react-summernote'
import {Button} from 'react-bootstrap'
import 'react-summernote/dist/react-summernote.css' // import styles
import 'react-summernote/lang/summernote-fr-FR' // you can import any other locale
//import 'bootstrap/dist/js/bootstrap.min.js';

// Import bootstrap(v3 or v4) dependencies
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/dropdown';
import 'bootstrap/js/dist/tooltip';
import 'bootstrap/dist/css/bootstrap.css';

export default class RichTextEditor extends React.Component {

  state = {
    valeur_force_reload: 'Init bug'
  }

  onChange = content => {
    this.props.onChange(content)
  }

  init = event => {
    console.debug("Init event : %O", event)
    this.setState({valeur_force_reload: ''})
    if(this.props.init) {
      this.props.init(event)
    }
  }

  show = event => {
    console.debug("Contenu : %O", this.state.contenu)
  }

  render() {
    return (
      <ReactSummernote
        value={this.state.valeur_force_reload || this.props.value}
        onInit={this.init}
        options={{
          lang: 'fr-FR',
          height: 200,
          dialogsInBody: true,
          toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'underline', 'clear']],
            ['fontname', ['fontname']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['view', ['fullscreen', 'codeview']]
          ]
        }}
        onChange={this.onChange}
      />
    )
  }
}
