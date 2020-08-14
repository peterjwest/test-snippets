import testSnippets, { components, dependencies, testSnippetsCommand, TagActions, Snippet } from './es5/index';
declare const testSnippetWrapper: typeof testSnippets & {
    components: typeof components,
    dependencies: typeof dependencies,
    testSnippetsCommand: typeof testSnippetsCommand,
    TagActions: TagActions,
    Snippet: Snippet,
};
export = testSnippetWrapper;
