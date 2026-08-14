import { Test, TestingModule } from '@nestjs/testing';
import { GlucoseService } from './glucose.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ConsentService } from '../../common/audit/consent.service';
import { GOLDEN_CLINICAL_TEST_CASES } from '@lifecode/shared';

describe('GlucoseService - Suíte de Validação de Casos-Ouro Clínicos', () => {
  let service: GlucoseService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      clinicalObservation: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'obs-123', ...data })),
      },
      alert: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'alert-123', ...data })),
      },
      $transaction: jest.fn((cb) => cb(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlucoseService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: { record: jest.fn() } },
        { provide: ConsentService, useValue: { assertActiveConsent: jest.fn().mockResolvedValue('user-golden') } },
      ],
    }).compile();

    service = module.get<GlucoseService>(GlucoseService);
  });

  GOLDEN_CLINICAL_TEST_CASES.forEach((goldenCase) => {
    it(`[${goldenCase.id}] ${goldenCase.name}`, async () => {
      const result = await service.ingestGlucose('tenant-test-id', goldenCase.input as any);

      if (goldenCase.expectedResult.shouldTriggerAlert) {
        expect(result.alertTriggered).toBe(goldenCase.expectedResult.expectedSeverity);
        expect(prismaMock.alert.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              severity: goldenCase.expectedResult.expectedSeverity,
              status: 'OPEN',
            }),
          })
        );
      } else {
        expect(result.alertTriggered).toBeNull();
        expect(prismaMock.alert.create).not.toHaveBeenCalled();
      }
    });
  });
});
