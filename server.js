const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

function analiseLexica(formula) {
    const regex = /^[A-Z\s\(\)\~\^\v\→\↔]+$/;
    return regex.test(formula);
}

function parentesesBalanceados(formula) {
    let stack = [];
    for (let c of formula) {
        if (c === '(') stack.push(c);
        if (c === ')') {
            if (stack.length === 0) return false;
            stack.pop();
        }
    }
    return stack.length === 0;
}

function analiseSintatica(formula) {
    if (!parentesesBalanceados(formula)) return false;
    const invalido = /[\^\v\→\↔]{2,}|[\^\v\→\↔]$|^[\^\v\→\↔]/;
    return !invalido.test(formula);
}

function avaliar(expr, valores) {
    let e = expr;

    for (let v in valores) {
        e = e.replaceAll(v, valores[v] ? "true" : "false");
    }

    e = e
        .replaceAll('~', '!')
        .replaceAll('^', '&&')
        .replaceAll('v', '||')
        .replaceAll('→', '<=')
        .replaceAll('↔', '===');

    try {
        return eval(e);
    } catch {
        return null;
    }
}

function gerarCombinacoes(vars) {
    const total = Math.pow(2, vars.length);
    let resultados = [];

    for (let i = 0; i < total; i++) {
        let linha = {};
        vars.forEach((v, j) => {
            linha[v] = Boolean(i & (1 << j));
        });
        resultados.push(linha);
    }

    return resultados;
}

function classificarFormula(formula) {
    const vars = [...new Set(formula.match(/[A-Z]/g))];
    const combinacoes = gerarCombinacoes(vars);

    let resultados = [];

    for (let valores of combinacoes) {
        const resultado = avaliar(formula, valores);
        resultados.push({ valores, resultado });
    }

    const todosVerdadeiros = resultados.every(r => r.resultado === true);
    const todosFalsos = resultados.every(r => r.resultado === false);

    let classificacao = "";

    if (todosVerdadeiros) classificacao = "TAUTOLOGIA ✅";
    else if (todosFalsos) classificacao = "CONTRADIÇÃO ❌";
    else classificacao = "CONTINGÊNCIA ⚠️";

    return { resultados, classificacao, vars };
}

app.post('/testar', (req, res) => {
    const { formula } = req.body;

    if (!analiseLexica(formula)) {
        return res.json({ erro: "Erro léxico ❌" });
    }

    if (!analiseSintatica(formula)) {
        return res.json({ erro: "Não é FBF ❌" });
    }

    const { resultados, classificacao, vars } = classificarFormula(formula);

    res.json({
        classificacao,
        resultados,
        vars
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));
