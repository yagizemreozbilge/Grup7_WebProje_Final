import React from 'react';
import './TextInput.css';

const TextInput = ({ label, error, ...props }) => {
        return ( <
                div className = "text-input-group" > {
                    label && < label htmlFor = { props.id || props.name } > { label } < /label>} <
                    input
                    className = { `text-input ${error ? 'error' : ''}` } {...props }
                    /> {
                        error && < span className = "error-message" > { error } < /span>} <
                            /div>
                    );
                };

                export default TextInput;