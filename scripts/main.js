function main() {
    const input_selector = document.querySelector('.input-text-field');
    const table_selector = document.querySelector('.output-table');
    const error_container_selector = document.querySelector('.error-container');

    input_selector.addEventListener('input', (event) => {
        const statement = event.target.value.trim();

        table_selector.innerHTML = '';
        if (statement === '') { return; }

        error_container_selector.innerHTML = '';
        error_container_selector.style.display = 'none';

        const statement_error = getStatementError(statement);
        if (statement_error) {
            error_container_selector.innerHTML = statement_error;
            error_container_selector.style.display = 'block';
        } else { updateTruthTable(table_selector, statement); }

    });
}

function getStatementError(statement) {
    const invalid_tokens_regex = /(\s)|([a-zA-Z]+([0-9]+)?)|!|~|¬|∧|\^|∨|&&|\|\||→|->|=>|↔|<->|<=>|\(|\)/g;
    const variables_regex = /([a-zA-Z]+([0-9]+)?)/g;

    const [invalid_token] = statement.replace(invalid_tokens_regex, '').split('');
    if (invalid_token) { return `The character ${invalid_token} was not recognized.`; }

    try { eval(replaceConnectives(statement).replace(variables_regex, true)); }
    catch (error) { return 'The statement is invalid.'; }

    return '';
}

function updateTruthTable(table_selector, statement) {
    const { variables, boolean_permutations, evaluations } = getDataFromStatement(statement);

    const table_heading_row = table_selector.insertRow();
    variables.forEach(variable => insertHeading(table_heading_row, variable));
    if (statement !== variables[0]) { insertHeading(table_heading_row, statement); }

    boolean_permutations.forEach((permutation, index) => {
        const row = table_selector.insertRow();
        permutation.forEach(value => insertCell(row, value));
        if (statement !== variables[0]) { insertCell(row, evaluations[index]); }
    });
}

function insertHeading(row, text) {
    row.innerHTML += `<th>${text}</th>`;
}

function insertCell(row, text) {
    const cell = row.insertCell();
    cell.innerHTML = text;
}

function getDataFromStatement(statement) {
    const cleaned_statement = replaceConnectives(statement);
    const variables = getVariables(cleaned_statement);
    const boolean_permutations = getBooleanPermutations(variables.length);
    const evaluations = evaluateStatement(cleaned_statement, variables, boolean_permutations);

    return { variables, boolean_permutations, evaluations };
}

function evaluateStatement(statement, variables, boolean_permutations) {
    const tokens = statement.match(/(&&)|(\|\|)|!|(<=)|(==)|\(|\)|([a-zA-Z]+([0-9]+)?)/g);
    return boolean_permutations.map(permutation => {
        const current_tokens = applyPermutationToTokens(tokens, variables, permutation);
        return evaluateTokens(current_tokens);
    });
}

function evaluateTokens(tokens) {
    let ungrouped_tokens = evaluateGroups(tokens);
    let negated_tokens = evaluateNegations(ungrouped_tokens);

    return negated_tokens.reduce((previous_evaluation, current_token, current_index) => {
        if (typeof current_token === 'boolean') { return previous_evaluation; }
        return eval(''.concat(
            previous_evaluation,
            current_token,
            negated_tokens[current_index + 1]
        ));
    });
}

function evaluateGroups(tokens) {
    const opening_token = '(';
    const closing_token = ')';

    if (!tokens.includes(opening_token) && !tokens.includes(closing_token)) { return tokens; }

    let is_tracking_group = false;
    let inner_groups = 0;

    const separated_tokens = tokens.reduce((previous_tokens, current_token) => {
        const previous_token_index = previous_tokens.length - 1;
        let previous_token = previous_tokens[previous_token_index]

        if (current_token === opening_token) { inner_groups += 1; }
        else if (current_token === closing_token) { inner_groups -= 1; }

        if (current_token === opening_token && !is_tracking_group) {
            is_tracking_group = true;
            return [...previous_tokens, []];
        }

        if (current_token === closing_token && inner_groups === 0) {
            is_tracking_group = false;
            return previous_tokens;
        }

        if (typeof previous_token === 'object' && is_tracking_group) {
            return [
                ...previous_tokens.slice(0, previous_token_index),
                [...previous_token, current_token]
            ];
        }

        return [...previous_tokens, current_token];
    }, []);

    return separated_tokens.map(separated => {
        if (typeof separated !== 'object') { return separated; }
        return evaluateTokens(separated);
    });
}

function evaluateNegations(tokens) {
    return tokens.reduceRight((negated_tokens, current_token, current_index) => {
        const negation_token = '!';
        if (current_token === negation_token) {
            const negation = eval(''.concat(negation_token, negated_tokens[current_index + 1]));
            const num_of_evaluated_tokens = 2;
            negated_tokens.splice(current_index, num_of_evaluated_tokens, negation);
        }

        return negated_tokens;
    }, tokens.slice(0));
}

function replaceConnectives(statement) {
    return (
        statement
            .replaceAll(/((\s)+(not)(\s)+)|~|¬/g, '!')
            .replaceAll(/((\s)+(and)(\s)+)|∧|\^/g, '&&')
            .replaceAll(/((\s)+(or)(\s)+)|∨/g, '||')
            .replaceAll(/→|->|=>/g, '<=')
            .replaceAll(/↔|<->|<=>/g, '==')
    );
}

function getVariables(statement) {
    const variables = statement.match(/([a-zA-Z]+([0-9]+)?)/g) || [];

    if (!variables) { return variables; }
    return variables.filter((variable, index, variables) => variables.indexOf(variable) === index)
}

function getBooleanPermutations(number_of_variables) {
    const number_of_permutations = getNthPowerOfTwo(number_of_variables);
    let boolean_permutations = [];

    for (let pmt_index = 0; pmt_index < number_of_permutations; pmt_index++) {
        let boolean_permutation = [];

        for (let var_index = number_of_variables - 1; var_index >= 0; var_index--) {
            const variable_value = Boolean(pmt_index & getNthPowerOfTwo(var_index));
            boolean_permutation.push(variable_value);
        }

        boolean_permutations.unshift(boolean_permutation);
    }

    return boolean_permutations;
}

function applyPermutationToTokens(tokens, variables, boolean_permutation) {
    return tokens.map(token => {
        if (!variables.includes(token)) { return token; }
        const variable_index = variables.indexOf(token);
        return boolean_permutation[variable_index];
    });
}

function getNthPowerOfTwo(number) { return 1 << number; }


main();
