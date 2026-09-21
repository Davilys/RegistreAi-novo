# RegistreAi — regras permanentes de execução e entrega

## Repositório e escopo
O repositório canônico é `Davilys/RegistreAi-novo`. Não desenvolver a V2 nos repositórios antigos. Preservar a identidade e as referências visuais aprovadas pelo usuário. Não alterar preços, titularidade dos planos ou promessas comerciais incidentalmente durante uma correção visual.

## Qualidade antes da entrega
Compilação bem-sucedida NÃO equivale a revisão visual, validação de segurança, integração funcionando ou implantação concluída.

Antes de apresentar uma alteração de interface como corrigida:
1. Reproduzir a falha informada e explicar a causa com base no código e no comportamento observado.
2. Reservar espaço real para textos, legendas, preços e selos. Não esconder falhas com `overflow: hidden`, offsets negativos, aumento de z-index ou posicionamento absoluto de texto sobre ilustrações.
3. Executar os testes do site e do worker e a suíte `npm run test:ui`. Esta suíte cobre 16 larguras entre 320 e 1920 pixels, incluindo limites de breakpoints, além de navegação, FAQ, fontes alternativas e texto ampliado.
4. Inspecionar capturas renderizadas de computador, tablet e celular. Testes de geometria não substituem inspeção visual.
5. Verificar teclado, foco, movimento reduzido, links, estados desativados e ausência de erros de JavaScript. Um botão sem integração configurada precisa explicar esse estado; não criar links falsos com `href="#"`.
6. Informar qual commit foi testado, o que passou, o que não foi testado e se a mudança está só no GitHub ou já foi aplicada ao VPS. Nunca dizer que a atualização está no ar sem verificar a implantação.
7. Não prometer ausência absoluta de defeitos. Não encerrar falhas conhecidas como resolvidas apenas porque um arquivo foi escrito.

## Backend, segurança e evidência
Nunca afirmar pagamento, geração de GRU, protocolo, cumprimento de prazo ou aprovação do INPI sem evidência externa verificável. Um mock/teste controlado não comprova uma integração real. A presença de duas chamadas de IA não garante a correção de um ato jurídico.

Segredos, senhas, service role, documentos e dados de clientes nunca devem entrar no Git, logs públicos ou screenshots de testes. Manter isolamento de workspaces, trilha de auditoria e bloqueios determinísticos. Integrações incompletas permanecem bloqueadas. Toda nova rotina crítica exige testes de falha, concorrência e isolamento antes da ativação.

## Atualização do VPS
Preservar configurações locais e ambientes. Preferir `git pull --ff-only` a `git reset --hard`; interromper em caso de divergência. Compilar antes de substituir o container. Não ativar o worker como efeito colateral de uma atualização visual. Um healthcheck HTTP apenas confirma disponibilidade do serviço; ele não prova que o layout ou as integrações estão corretos.
