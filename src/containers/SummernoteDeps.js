import React from 'react'
import ReactSummernote from 'react-summernote'
import 'react-summernote/dist/react-summernote.css' // import styles
import 'react-summernote/lang/summernote-fr-FR' // you can import any other locale
//import 'bootstrap/dist/js/bootstrap.min.js';

// Import bootstrap(v3 or v4) dependencies
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/dropdown';
import 'bootstrap/js/dist/tooltip';
import 'bootstrap/dist/css/bootstrap.css';

export default class RichTextEditor extends React.Component {
  onChange(content) {
    console.log('onChange', content)
  }

  render() {
    return (
      <ReactSummernote
        value="<p>Allo!</p>"
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
