<?php

namespace App\Service;

use App\Entity\Centre;
use App\Entity\Contact;
use App\Entity\DemandeB2B;
use App\Entity\Reservation;
use App\Repository\ContactRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Dérive/actualise un {@see Contact} CRM depuis une réservation ou une demande B2B.
 *
 * Déduplication par email AU SEIN DU CENTRE : la recherche se fait sur le hash
 * déterministe de l'email (jamais l'email en clair), bornée au centre — un même
 * email dans deux centres reste deux contacts distincts (isolation préservée).
 * Fail-closed : pas de centre → aucune écriture CRM. PII chiffrées à la persistance.
 */
final class ContactDeriver
{
    public function __construct(
        private readonly ContactRepository $contacts,
        private readonly EntityManagerInterface $em,
        private readonly PiiCipher $cipher,
    ) {
    }

    public function upsertFromReservation(Reservation $reservation): ?Contact
    {
        return $this->upsert(
            $reservation->getCentre(),
            (string) $reservation->getNomInvite(),
            (string) $reservation->getEmailInvite(),
            $reservation->getTelephoneInvite(),
            Contact::SEGMENT_B2C,
        );
    }

    public function upsertFromDemande(DemandeB2B $demande): ?Contact
    {
        return $this->upsert(
            $demande->getCentre(),
            (string) $demande->getNomContact(),
            (string) $demande->getEmail(),
            $demande->getTelephone(),
            Contact::SEGMENT_B2B,
        );
    }

    public function upsert(?Centre $centre, string $nom, string $email, ?string $telephone, string $segment): ?Contact
    {
        $email = trim($email);
        // Fail-closed : sans centre (ou sans email exploitable), aucune écriture CRM.
        if (null === $centre || '' === $email) {
            return null;
        }

        $hash = $this->cipher->hashEmail($email);

        $contact = $this->contacts->findOneByCentreAndEmailHash($centre, $hash);
        if (null === $contact) {
            $contact = (new Contact())->setCentre($centre)->setEmailHash($hash);
            $this->em->persist($contact);
        }

        $contact->setNom(trim($nom))->setEmail($email);
        if (null !== $telephone && '' !== trim($telephone)) {
            $contact->setTelephone(trim($telephone));
        }
        $contact->addSegment($segment);
        $contact->touch();

        $this->em->flush();

        return $contact;
    }
}
