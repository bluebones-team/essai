import type { z } from 'zod';
import {
  filter,
  participant,
  project,
  report,
  shared,
  user,
} from '../data/schema';

declare global {
  namespace Shared {
    type Timestamp = z.infer<typeof shared.timestamp>;
    type Duration = z.infer<typeof shared.duration>;
    type Message = z.infer<typeof shared.message>;
    type Position = z.infer<typeof shared.position>;
    type Token = z.infer<typeof shared.token>;
    type Output<D = any> = z.infer<
      ReturnType<typeof shared.output<z.ZodType<D>>>
    >;
  }
  interface Project {
    // type ParticipantCondition = z.infer<typeof project.participantCondition>;
    // type RecruitmentContent = z.infer<typeof project.recruitmentContent>;
    recruitment: z.infer<typeof project.recruitment>;
    public: {
      Preview: z.infer<typeof project.public.preview>;
      Supply: z.infer<typeof project.public.supply>;
      Data: z.infer<typeof project.public.data>;
      Schedule: z.infer<typeof project.public.schedule>;
    };
    joined: {
      Preview: z.infer<typeof project.joined.preview>;
      Supply: z.infer<typeof project.joined.supply>;
      Data: z.infer<typeof project.joined.data>;
      Schedule: z.infer<typeof project.joined.schedule>;
    };
    own: {
      Preview: z.infer<typeof project.own.preview>;
      Supply: z.infer<typeof project.own.supply>;
      Data: z.infer<typeof project.own.data>;
      Schedule: z.infer<typeof project.own.schedule>;
    };
    Preview:
      | Project['public']['Preview']
      | Project['joined']['Preview']
      | Project['own']['Preview'];
    Supply:
      | Project['public']['Supply']
      | Project['joined']['Supply']
      | Project['own']['Supply'];
    Data:
      | Project['public']['Data']
      | Project['joined']['Data']
      | Project['own']['Data'];
    Schedule:
      | Project['public']['Schedule']
      | Project['joined']['Schedule']
      | Project['own']['Schedule'];
  }
  namespace Participant {
    type Join = z.infer<typeof participant.join>;
    type Lib = z.infer<typeof participant.lib>;
  }
  namespace Filter {
    type Range = z.infer<typeof filter.range>;
    type Data = z.infer<typeof filter.data>;
  }
  namespace User {
    type Public = z.infer<typeof user.public>;
    type Editable = z.infer<typeof user.editable>;
    type Own = z.infer<typeof user.own>;
    type Auth = z.infer<typeof user.auth>;
  }
  namespace ReportData {
    type Project = z.infer<typeof report.project>;
    type User = z.infer<typeof report.user>;
  }
}
