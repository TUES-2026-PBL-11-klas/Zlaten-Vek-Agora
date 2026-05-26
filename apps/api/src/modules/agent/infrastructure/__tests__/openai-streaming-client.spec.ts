import { ConfigService } from '@nestjs/config';
import { OpenAIStreamingClient } from '../openai-streaming-client';

const mockStream = async function* (tokens: string[]) {
  for (const token of tokens) {
    yield { choices: [{ delta: { content: token } }] };
  }
};

const mockCreate = jest.fn();

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
    baseURL: 'https://api.openai.com',
  })),
}));

describe('OpenAIStreamingClient', () => {
  let client: OpenAIStreamingClient;

  beforeEach(() => {
    const config = {
      get: (key: string) => {
        if (key === 'OPENAI_API_KEY') return 'test-key';
        if (key === 'OPENAI_DEFAULT_MODEL') return 'gpt-4o-mini';
        return undefined;
      },
    } as unknown as ConfigService;

    client = new OpenAIStreamingClient(config);
  });

  afterEach(() => jest.clearAllMocks());

  it('yields tokens from the OpenAI stream', async () => {
    mockCreate.mockResolvedValue(mockStream(['Hello', ', ', 'world']));

    const tokens: string[] = [];
    for await (const t of client.streamCompletion([{ role: 'user', content: 'Hi' }])) {
      tokens.push(t);
    }

    expect(tokens).toEqual(['Hello', ', ', 'world']);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o-mini', stream: true }),
    );
  });

  it('uses the model override from options', async () => {
    mockCreate.mockResolvedValue(mockStream(['ok']));

    const tokens: string[] = [];
    for await (const t of client.streamCompletion([{ role: 'user', content: 'x' }], {
      model: 'gpt-5',
    })) {
      tokens.push(t);
    }

    expect(tokens).toEqual(['ok']);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-5' }));
  });

  it('skips empty/undefined delta content', async () => {
    mockCreate.mockResolvedValue(
      (async function* () {
        yield { choices: [{ delta: { content: '' } }] };
        yield { choices: [{ delta: {} }] };
        yield { choices: [{ delta: { content: 'real' } }] };
      })(),
    );

    const tokens: string[] = [];
    for await (const t of client.streamCompletion([{ role: 'user', content: 'x' }])) {
      tokens.push(t);
    }

    expect(tokens).toEqual(['real']);
  });
});
